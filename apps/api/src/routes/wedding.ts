import { Router } from "express";
import { weddingUpdateSchema } from "@wedding/shared";
import { Member, Wedding } from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, cleanString, iso, validate } from "./helpers.js";
import type { Wedding as WeddingDTO } from "@wedding/shared";

function serializeWedding(doc: {
  _id: unknown;
  weddingDate: Date;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}): WeddingDTO {
  return {
    id: String(doc._id),
    ownerId: doc.ownerId as string,
    weddingName: doc.weddingName as string,
    partnerOneName: doc.partnerOneName as string,
    partnerTwoName: (doc.partnerTwoName as string) ?? "",
    weddingDate: iso(doc.weddingDate) as string,
    timezone: doc.timezone as string,
    currency: doc.currency as string,
    estimatedGuestCount: doc.estimatedGuestCount as number | undefined,
    totalBudgetMinor: doc.totalBudgetMinor as number,
    weddingType: doc.weddingType as string | undefined,
    location: doc.location as string | undefined,
    coverImageUrl: doc.coverImageUrl as string | undefined,
    plan: doc.plan as string | undefined,
    subscriptionStatus: doc.subscriptionStatus as string | undefined,
    createdAt: iso(doc.createdAt) as string,
    updatedAt: iso(doc.updatedAt) as string,
  };
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const wedding = await Wedding.findById(authed.weddingId).lean();
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");
    res.json({ wedding: serializeWedding(wedding), role: authed.role });
  }),
);

router.patch(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(weddingUpdateSchema, req.body);

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "weddingDate") {
        updates.weddingDate = new Date(value as string);
      } else if (key === "coverImageUrl") {
        updates.coverImageUrl = cleanString(value as string);
      } else {
        updates[key] = value;
      }
    }

    const wedding = await Wedding.findByIdAndUpdate(authed.weddingId, updates, {
      new: true,
      lean: true,
    });
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "wedding_updated",
      entityType: "wedding",
      entityId: authed.weddingId,
      message: `${authed.user.displayName} updated the wedding settings`,
    });

    res.json({ wedding: serializeWedding(wedding) });
  }),
);

export default router;
