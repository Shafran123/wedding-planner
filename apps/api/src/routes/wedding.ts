import { Router } from "express";
import { weddingUpdateSchema } from "@wedding/shared";
import {
  BudgetCategory,
  Expense,
  Location,
  Member,
  Payment,
  Task,
  Vendor,
  Wedding,
} from "../models/index.js";
import { NotFoundError, ValidationError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, cleanString, iso, validate } from "./helpers.js";
import { ratesToObject } from "../domain/currency.js";
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
    rates: ratesToObject(doc.rates as Map<string, number> | Record<string, number> | null | undefined),
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

    const wedding = await Wedding.findById(authed.weddingId);
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || key === "rate") continue;
      if (key === "weddingDate") {
        updates.weddingDate = new Date(value as string);
      } else if (key === "coverImageUrl") {
        updates.coverImageUrl = cleanString(value as string);
      } else {
        updates[key] = value;
      }
    }

    const currencyChange =
      input.currency !== undefined && input.currency !== wedding.currency;
    if (currencyChange) {
      const changeRate = input.rate;
      if (!changeRate || changeRate <= 0) {
        throw new ValidationError(
          "Enter an exchange rate to convert existing amounts to the new currency.",
        );
      }
      const oldBase = wedding.currency;
      const newBase = input.currency as string;

      const baseFieldPipeline = (
        fields: Record<string, string>,
      ): Record<string, unknown>[] => {
        const set: Record<string, unknown> = {
          rate: { $cond: [{ $eq: ["$currency", newBase] }, 1, changeRate] },
        };
        for (const [baseField, minorField] of Object.entries(fields)) {
          set[baseField] = {
            $round: [
              {
                $cond: [
                  { $eq: ["$currency", newBase] },
                  `$${minorField}`,
                  { $multiply: [`$${minorField}`, changeRate] },
                ],
              },
              0,
            ],
          };
        }
        return [{ $set: set }];
      };

      await Promise.all([
        Expense.updateMany(
          { weddingId: authed.weddingId },
          baseFieldPipeline({
            baseEstimatedMinor: "estimatedMinor",
            baseActualMinor: "actualMinor",
          }),
        ),
        Payment.updateMany(
          { weddingId: authed.weddingId },
          baseFieldPipeline({ baseAmountMinor: "amountMinor" }),
        ),
        Vendor.updateMany(
          { weddingId: authed.weddingId },
          baseFieldPipeline({ basePriceMinor: "priceMinor" }),
        ),
        Task.updateMany(
          { weddingId: authed.weddingId },
          baseFieldPipeline({
            baseEstimatedCostMinor: "estimatedCostMinor",
            baseActualCostMinor: "actualCostMinor",
          }),
        ),
        Location.updateMany(
          { weddingId: authed.weddingId },
          baseFieldPipeline({
            baseEstimatedCostMinor: "estimatedCostMinor",
            baseActualCostMinor: "actualCostMinor",
          }),
        ),
        BudgetCategory.updateMany(
          { weddingId: authed.weddingId },
          [
            {
              $set: {
                plannedMinor: {
                  $round: [{ $multiply: ["$plannedMinor", changeRate] }, 0],
                },
              },
            },
          ],
        ),
      ]);

      updates.currency = newBase;
      if (input.totalBudgetMinor === undefined) {
        updates.totalBudgetMinor = Math.round(
          wedding.totalBudgetMinor * changeRate,
        );
      }
      updates.rates = { [oldBase]: changeRate };
    }

    const updated = await Wedding.findByIdAndUpdate(authed.weddingId, updates, {
      new: true,
      lean: true,
    });
    if (!updated) throw new NotFoundError("We couldn't find your wedding.");

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "wedding_updated",
      entityType: "wedding",
      entityId: authed.weddingId,
      message: `${authed.user.displayName} updated the wedding settings`,
    });

    res.json({ wedding: serializeWedding(updated) });
  }),
);

export default router;
