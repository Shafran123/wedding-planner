import { Router } from "express";
import crypto from "node:crypto";
import { invitationSchema } from "@wedding/shared";
import type { Invitation as InvitationDTO } from "@wedding/shared";
import { Invitation, Member, Wedding } from "../models/index.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, iso, validate } from "./helpers.js";

const INVITE_TTL_DAYS = 7;

function serializeInvitation(doc: {
  _id: unknown;
  weddingId: unknown;
  expiresAt: Date;
  createdAt: Date;
  [key: string]: unknown;
}): InvitationDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    email: doc.email as string,
    role: doc.role as InvitationDTO["role"],
    token: doc.token as string,
    status: doc.status as InvitationDTO["status"],
    invitedBy: doc.invitedBy as string,
    expiresAt: iso(doc.expiresAt) as string,
    createdAt: iso(doc.createdAt) as string,
  };
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const invitations = await Invitation.find({ weddingId: authed.weddingId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ invitations: invitations.map(serializeInvitation) });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(invitationSchema, req.body);

    const email = input.email.toLowerCase();
    const alreadyMember = await Member.findOne({
      weddingId: authed.weddingId,
      email,
    });
    if (alreadyMember) {
      throw new ValidationError(`${email} is already a member of this wedding.`);
    }

    const token = crypto.randomBytes(24).toString("hex");
    const invitation = await Invitation.create({
      weddingId: authed.weddingId,
      email,
      role: input.role,
      token,
      invitedBy: authed.uid,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    });

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "member_invited",
      entityType: "invitation",
      entityId: String(invitation._id),
      message: `${authed.user.displayName} invited ${email} as ${input.role}`,
    });

    res.status(201).json({
      invitation: serializeInvitation(invitation.toObject()),
      inviteUrl: `/invite/${token}`,
    });
  }),
);

router.get(
  "/:token",
  requireAuth,
  asyncHandler(async (req, res) => {
    const invitation = await Invitation.findOne({ token: req.params.token }).lean();
    if (!invitation) throw new NotFoundError("This invitation doesn't exist.");

    const wedding = await Wedding.findById(invitation.weddingId).lean();
    res.json({
      weddingName: wedding?.weddingName,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expired:
        invitation.status === "pending" && invitation.expiresAt.getTime() < Date.now(),
    });
  }),
);

router.post(
  "/:token/accept",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const invitation = await Invitation.findOne({ token: req.params.token });
    if (!invitation) throw new NotFoundError("This invitation doesn't exist.");

    if (invitation.status !== "pending") {
      throw new ValidationError("This invitation has already been used.");
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("This invitation has expired.");
    }
    if (invitation.email.toLowerCase() !== authed.user.email.toLowerCase()) {
      throw new ForbiddenError(
        "This invitation was sent to a different email address.",
      );
    }

    const weddingId = String(invitation.weddingId);
    const alreadyMember = await Member.findOne({
      weddingId,
      userId: authed.uid,
    });
    if (alreadyMember) {
      throw new ValidationError("You are already a member of this wedding.");
    }

    await Member.create({
      weddingId,
      userId: authed.uid,
      role: invitation.role,
      displayName: authed.user.displayName,
      email: authed.user.email,
    });

    invitation.status = "accepted";
    await invitation.save();

    await writeActivity({
      weddingId,
      actor: actorOf(authed),
      type: "member_joined",
      entityType: "member",
      message: `${authed.user.displayName} joined the wedding as ${invitation.role}`,
    });

    res.json({ weddingId });
  }),
);

export default router;
