import { Router } from "express";
import type { Notification as NotificationDTO } from "@wedding/shared";
import { Notification } from "../models/index.js";
import { NotFoundError } from "../errors.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { iso } from "./helpers.js";

function serializeNotification(doc: {
  _id: unknown;
  weddingId: unknown;
  createdAt: Date;
  [key: string]: unknown;
}): NotificationDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    userId: doc.userId as string,
    type: doc.type as NotificationDTO["type"],
    title: doc.title as string,
    message: doc.message as string,
    read: doc.read as boolean,
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
    const notifications = await Notification.find({
      weddingId: authed.weddingId,
      userId: authed.uid,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unread = notifications.filter((n) => !n.read).length;
    res.json({
      notifications: notifications.map(serializeNotification),
      unread,
    });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, weddingId: authed.weddingId, userId: authed.uid },
      { read: true },
      { new: true, lean: true },
    );
    if (!notification) throw new NotFoundError("We couldn't find that notification.");
    res.json({ notification: serializeNotification(notification) });
  }),
);

router.post(
  "/read-all",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    await Notification.updateMany(
      { weddingId: authed.weddingId, userId: authed.uid, read: false },
      { read: true },
    );
    res.json({ ok: true });
  }),
);

export default router;
