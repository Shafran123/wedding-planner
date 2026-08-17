import { Router } from "express";
import { attachmentSchema } from "@wedding/shared";
import type { Attachment as AttachmentDTO } from "@wedding/shared";
import { Attachment } from "../models/index.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, iso, validate } from "./helpers.js";

function serializeAttachment(doc: {
  _id: unknown;
  weddingId: unknown;
  createdAt: Date;
  [key: string]: unknown;
}): AttachmentDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name as string,
    url: doc.url as string,
    mimeType: doc.mimeType as string,
    size: doc.size as number,
    kind: doc.kind as AttachmentDTO["kind"],
    uploadedBy: doc.uploadedBy as string,
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
    const attachments = await Attachment.find({ weddingId: authed.weddingId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ attachments: attachments.map(serializeAttachment) });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(attachmentSchema, req.body);

    const attachment = await Attachment.create({
      weddingId: authed.weddingId,
      name: input.name,
      url: input.url,
      mimeType: input.mimeType,
      size: input.size,
      kind: input.kind,
      uploadedBy: authed.uid,
    });

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "attachment_added",
      entityType: "attachment",
      entityId: String(attachment._id),
      message: `${authed.user.displayName} uploaded "${input.name}"`,
    });

    res.status(201).json({ attachment: serializeAttachment(attachment.toObject()) });
  }),
);

export default router;
