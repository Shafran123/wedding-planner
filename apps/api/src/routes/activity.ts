import { Router } from "express";
import type { Activity as ActivityDTO } from "@wedding/shared";
import { Activity } from "../models/index.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { iso } from "./helpers.js";

function serializeActivity(doc: {
  _id: unknown;
  weddingId: unknown;
  createdAt: Date;
  [key: string]: unknown;
}): ActivityDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    actorId: doc.actorId as string,
    actorName: doc.actorName as string,
    type: doc.type as ActivityDTO["type"],
    entityType: doc.entityType as string,
    entityId: doc.entityId ? String(doc.entityId) : undefined,
    message: doc.message as string,
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
    const limit = Math.min(Number(req.query.limit ?? 30), 100);
    const filter: Record<string, unknown> = { weddingId: authed.weddingId };
    if (req.query.cursor) {
      const cursorDate = new Date(String(req.query.cursor));
      if (!Number.isNaN(cursorDate.getTime())) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const nextCursor =
      activities.length === limit
        ? iso(activities[activities.length - 1]?.createdAt as Date)
        : undefined;

    res.json({
      activities: activities.map(serializeActivity),
      nextCursor,
    });
  }),
);

export default router;
