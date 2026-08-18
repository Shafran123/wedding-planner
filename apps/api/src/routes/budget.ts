import { Router } from "express";
import mongoose from "mongoose";
import { budgetUpdateSchema, budgetCategorySchema } from "@wedding/shared";
import type {
  BudgetCategory as BudgetCategoryDTO,
  BudgetTotals,
} from "@wedding/shared";
import {
  BudgetCategory,
  Expense,
  Payment,
  Wedding,
} from "../models/index.js";
import { ConflictError, NotFoundError } from "../errors.js";
import { computeBudget, computeCategorySpend } from "../domain/money.js";
import { buildBudgetInput } from "../services/budget.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, iso, validate } from "./helpers.js";

function serializeCategory(
  doc: {
    _id: unknown;
    weddingId: unknown;
    createdAt: Date;
    name: string;
    plannedMinor: number;
  },
  expenseCount?: number,
): BudgetCategoryDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name,
    plannedMinor: doc.plannedMinor,
    expenseCount,
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
    const [wedding, categories, budgetInput, expenseCounts] =
      await Promise.all([
        Wedding.findById(authed.weddingId).lean(),
        BudgetCategory.find({ weddingId: authed.weddingId })
          .sort({ name: 1 })
          .lean(),
        buildBudgetInput(authed.weddingId),
        Expense.aggregate<{ _id: unknown; n: number }>([
          {
            $match: {
              weddingId: new mongoose.Types.ObjectId(authed.weddingId),
              deletedAt: null,
              categoryId: { $ne: null },
            },
          },
          { $group: { _id: "$categoryId", n: { $sum: 1 } } },
        ]),
      ]);
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");

    const budget: BudgetTotals = computeBudget(budgetInput);
    const categorySpend = computeCategorySpend(budgetInput);
    const countByCategory = new Map(
      expenseCounts.map((c) => [String(c._id), c.n]),
    );

    res.json({
      budget,
      categories: categories.map((c) =>
        serializeCategory(c, countByCategory.get(String(c._id)) ?? 0),
      ),
      categorySpend,
    });
  }),
);

router.patch(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(budgetUpdateSchema, req.body);
    if (input.totalBudgetMinor === undefined) {
      res.json({ ok: true });
      return;
    }

    const wedding = await Wedding.findByIdAndUpdate(
      authed.weddingId,
      { totalBudgetMinor: input.totalBudgetMinor },
      { new: true, lean: true },
    );
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "budget_updated",
      entityType: "wedding",
      entityId: authed.weddingId,
      message: `${authed.user.displayName} updated the total budget`,
    });

    res.json({ ok: true, totalBudgetMinor: wedding.totalBudgetMinor });
  }),
);

router.post(
  "/categories",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(budgetCategorySchema, req.body);

    const existing = await BudgetCategory.findOne({
      weddingId: authed.weddingId,
      name: new RegExp(`^${input.name}$`, "i"),
    });
    if (existing) {
      throw new ConflictError("A category with this name already exists.");
    }

    const category = await BudgetCategory.create({
      weddingId: authed.weddingId,
      name: input.name,
      plannedMinor: input.plannedMinor,
    });
    res.status(201).json({ category: serializeCategory(category.toObject()) });
  }),
);

router.put(
  "/categories/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(budgetCategorySchema.pick({ plannedMinor: true }), req.body);
    const category = await BudgetCategory.findOneAndUpdate(
      { _id: req.params.id, weddingId: authed.weddingId },
      { plannedMinor: input.plannedMinor },
      { new: true, lean: true },
    );
    if (!category) throw new NotFoundError("We couldn't find that category.");
    res.json({ category: serializeCategory(category) });
  }),
);

router.patch(
  "/categories/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(budgetCategorySchema.partial(), req.body);

    if (input.name !== undefined) {
      const existing = await BudgetCategory.findOne({
        weddingId: authed.weddingId,
        _id: { $ne: req.params.id },
        name: new RegExp(`^${input.name}$`, "i"),
      });
      if (existing) {
        throw new ConflictError("A category with this name already exists.");
      }
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.plannedMinor !== undefined) updates.plannedMinor = input.plannedMinor;

    const category = await BudgetCategory.findOneAndUpdate(
      { _id: req.params.id, weddingId: authed.weddingId },
      updates,
      { new: true, lean: true },
    );
    if (!category) throw new NotFoundError("We couldn't find that category.");
    res.json({ category: serializeCategory(category) });
  }),
);

router.delete(
  "/categories/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const inUse = await Expense.countDocuments({
      weddingId: authed.weddingId,
      categoryId: req.params.id,
    });
    if (inUse > 0) {
      throw new ConflictError(
        "This category has expenses. Move or remove them before deleting it.",
      );
    }

    const category = await BudgetCategory.findOneAndDelete({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!category) throw new NotFoundError("We couldn't find that category.");
    res.status(204).end();
  }),
);

export default router;
