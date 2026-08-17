import { Router } from "express";
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
import { NotFoundError } from "../errors.js";
import { computeBudget, computeCategorySpend } from "../domain/money.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, iso, validate } from "./helpers.js";

function serializeCategory(doc: {
  _id: unknown;
  weddingId: unknown;
  createdAt: Date;
  name: string;
  plannedMinor: number;
}): BudgetCategoryDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name,
    plannedMinor: doc.plannedMinor,
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
    const [wedding, categories, expenses, payments] = await Promise.all([
      Wedding.findById(authed.weddingId).lean(),
      BudgetCategory.find({ weddingId: authed.weddingId }).sort({ name: 1 }).lean(),
      Expense.find({ weddingId: authed.weddingId }).lean(),
      Payment.find({ weddingId: authed.weddingId }).lean(),
    ]);
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");

    const budgetInput = {
      totalBudgetMinor: wedding.totalBudgetMinor,
      categories: categories.map((c) => ({
        id: String(c._id),
        name: c.name,
        plannedMinor: c.plannedMinor,
      })),
      expenses: expenses.map((e) => ({
        id: String(e._id),
        categoryId: e.categoryId ? String(e.categoryId) : undefined,
        status: e.status,
        estimatedMinor: e.estimatedMinor,
        paymentStatus: e.paymentStatus,
      })),
      payments: payments.map((p) => ({
        id: String(p._id),
        expenseId: p.expenseId ? String(p.expenseId) : undefined,
        status: p.status,
        amountMinor: p.amountMinor,
        dueDate: iso(p.dueDate) as string,
      })),
    };

    const budget: BudgetTotals = computeBudget(budgetInput);
    const categorySpend = computeCategorySpend(budgetInput);

    res.json({
      budget,
      categories: categories.map(serializeCategory),
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

export default router;
