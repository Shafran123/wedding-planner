import { Router } from "express";
import type { Notification as NotificationDTO } from "@wedding/shared";
import { Notification, Task } from "../models/index.js";
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
    const [notifications, tasks] = await Promise.all([
      Notification.find({
        weddingId: authed.weddingId,
        userId: authed.uid,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Task.find({ weddingId: authed.weddingId }).lean(),
    ]);

    // Task due-soon/overdue alerts are computed from live task data
    // (spec: not persisted; no cron needed at MVP).
    const now = new Date();
    const synthetic: NotificationDTO[] = [];
    for (const task of tasks) {
      if (task.status !== "todo" && task.status !== "in_progress") continue;
      if (!task.dueDate) continue;
      const due = task.dueDate.getTime();
      const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const diffDays = Math.round((due - todayStart) / 86_400_000);
      if (diffDays < 0) {
        synthetic.push({
          id: `task-overdue-${String(task._id)}`,
          weddingId: authed.weddingId,
          userId: authed.uid,
          type: "task_overdue",
          title: "Task overdue",
          message: `"${task.title}" is overdue.`,
          read: false,
          createdAt: task.updatedAt.toISOString(),
        });
      } else if (diffDays <= 3) {
        synthetic.push({
          id: `task-due-${String(task._id)}`,
          weddingId: authed.weddingId,
          userId: authed.uid,
          type: "task_due_soon",
          title: "Task due soon",
          message: `"${task.title}" is due ${diffDays === 0 ? "today" : `in ${diffDays} day${diffDays === 1 ? "" : "s"}`}.`,
          read: false,
          createdAt: task.updatedAt.toISOString(),
        });
      }
    }

    const all = [
      ...synthetic,
      ...notifications.map(serializeNotification),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unread = notifications.filter((n) => !n.read).length + synthetic.length;
    res.json({ notifications: all.slice(0, 50), unread });
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
