import { Router } from "express";
import { memberRoleSchema } from "@wedding/shared";
import { Member } from "../models/index.js";
import { ForbiddenError, NotFoundError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, validate } from "./helpers.js";

const router = Router();

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(memberRoleSchema, req.body);

    const member = await Member.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!member) throw new NotFoundError("We couldn't find that member.");
    if (member.role === "owner") {
      throw new ForbiddenError("The owner's role cannot be changed.");
    }

    member.role = input.role;
    await member.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "wedding_updated",
      entityType: "member",
      entityId: String(member._id),
      message: `${authed.user.displayName} changed ${member.displayName}'s role to ${input.role}`,
    });

    res.json({ member: { id: String(member._id), role: member.role } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const member = await Member.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!member) throw new NotFoundError("We couldn't find that member.");
    if (member.role === "owner") {
      throw new ForbiddenError("The owner cannot be removed.");
    }
    if (member.userId === authed.uid) {
      throw new ForbiddenError("Remove yourself via settings instead.");
    }

    await member.deleteOne();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "member_removed",
      entityType: "member",
      message: `${authed.user.displayName} removed ${member.displayName} from the wedding`,
    });

    res.status(204).end();
  }),
);

export default router;
