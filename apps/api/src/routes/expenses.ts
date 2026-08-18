import { Router } from "express";
import { expenseSchema, expenseUpdateSchema } from "@wedding/shared";
import type { Expense as ExpenseDTO } from "@wedding/shared";
import { BudgetCategory, Expense, Vendor, Wedding } from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import { normalizeMoney, weddingRateFor } from "../domain/currency.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, cleanString, iso, validate } from "./helpers.js";
import { asSoftDeletable } from "../models/softDelete.js";

function serializeExpense(
  doc: Record<string, unknown>,
  categoryNames: Map<string, string>,
  vendorNames: Map<string, string>,
): ExpenseDTO {
  const categoryId = doc.categoryId ? String(doc.categoryId) : undefined;
  const vendorId = doc.vendorId ? String(doc.vendorId) : undefined;
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    categoryId,
    categoryName: categoryId ? categoryNames.get(categoryId) : undefined,
    vendorId,
    vendorName: vendorId ? vendorNames.get(vendorId) : undefined,
    name: doc.name as string,
    description: (doc.description as string) || undefined,
    estimatedMinor: doc.estimatedMinor as number,
    actualMinor: (doc.actualMinor as number | null) ?? undefined,
    currency: (doc.currency as string) || "AED",
    rate: (doc.rate as number) ?? 1,
    baseEstimatedMinor: (doc.baseEstimatedMinor as number) ?? (doc.estimatedMinor as number),
    baseActualMinor:
      ((doc.baseActualMinor as number | null) ?? (doc.actualMinor as number | null)) ??
      undefined,
    status: doc.status as ExpenseDTO["status"],
    paymentStatus: doc.paymentStatus as ExpenseDTO["paymentStatus"],
    dueDate: iso(doc.dueDate as Date | null),
    notes: (doc.notes as string) || undefined,
    receiptUrl: (doc.receiptUrl as string) || undefined,
    createdAt: iso(doc.createdAt as Date) as string,
    updatedAt: iso(doc.updatedAt as Date) as string,
  };
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const filter: Record<string, unknown> = { weddingId: authed.weddingId };
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.vendorId) filter.vendorId = req.query.vendorId;
    if (req.query.q) {
      filter.name = { $regex: String(req.query.q), $options: "i" };
    }

    const [expenses, categories, vendors] = await Promise.all([
      Expense.find(filter).limit(500).lean(),
      BudgetCategory.find({ weddingId: authed.weddingId }).lean(),
      Vendor.find({ weddingId: authed.weddingId }).lean(),
    ]);
    const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));
    const vendorNames = new Map(vendors.map((v) => [String(v._id), v.name]));

    res.json({
      expenses: expenses.map((e) =>
        serializeExpense(e as unknown as Record<string, unknown>, categoryNames, vendorNames),
      ),
    });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(expenseSchema, req.body);

    const wedding = await Wedding.findById(authed.weddingId);
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");
    const fallback = weddingRateFor(
      wedding.rates,
      input.currency ?? wedding.currency,
    );
    const estimated = normalizeMoney(
      {
        minor: input.estimatedMinor,
        currency: input.currency,
        rate: input.rate,
      },
      wedding.currency,
      fallback,
    );
    const actual = normalizeMoney(
      {
        minor: input.actualMinor,
        currency: input.currency,
        rate: input.rate,
      },
      wedding.currency,
      fallback,
    );

    const expense = await Expense.create({
      weddingId: authed.weddingId,
      categoryId: cleanString(input.categoryId) ?? null,
      vendorId: cleanString(input.vendorId) ?? null,
      name: input.name,
      description: input.description ?? "",
      estimatedMinor: input.estimatedMinor,
      actualMinor: input.actualMinor ?? null,
      currency: estimated?.currency ?? input.currency ?? wedding.currency,
      rate: estimated?.rate ?? 1,
      baseEstimatedMinor: estimated?.baseMinor ?? null,
      baseActualMinor: actual?.baseMinor ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes ?? "",
      receiptUrl: input.receiptUrl ?? null,
    });

    if (estimated && estimated.currency !== wedding.currency) {
      wedding.rates.set(estimated.currency, estimated.rate);
      wedding.markModified("rates");
      await wedding.save();
    }

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "expense_created",
      entityType: "expense",
      entityId: String(expense._id),
      message: `${authed.user.displayName} added the expense "${input.name}"`,
    });

    res.status(201).json({ expense: { id: String(expense._id) } });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const expense = await Expense.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!expense) throw new NotFoundError("We couldn't find that expense.");
    res.json({
      expense: serializeExpense(
        expense as unknown as Record<string, unknown>,
        new Map(),
        new Map(),
      ),
    });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(expenseUpdateSchema, req.body);

    const expense = await Expense.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!expense) throw new NotFoundError("We couldn't find that expense.");

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "dueDate") {
        expense.set("dueDate", value ? new Date(value as string) : null);
      } else if (key === "categoryId" || key === "vendorId") {
        expense.set(key, cleanString(value as string) ?? null);
      } else {
        expense.set(key, value);
      }
    }

    const wedding = await Wedding.findById(authed.weddingId);
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");
    const currencyChanged = input.currency !== undefined;
    const rateChanged = input.rate !== undefined;
    const storedCurrency =
      (expense.get("currency") as string | undefined) ?? wedding.currency;
    const storedRate =
      currencyChanged && !rateChanged
        ? undefined
        : ((expense.get("rate") as number | null | undefined) ?? undefined);
    const fallback = weddingRateFor(wedding.rates, storedCurrency);
    const estimated = normalizeMoney(
      {
        minor: expense.get("estimatedMinor") as number | null,
        currency: storedCurrency,
        rate: storedRate,
      },
      wedding.currency,
      fallback,
    );
    const actual = normalizeMoney(
      {
        minor: expense.get("actualMinor") as number | null,
        currency: storedCurrency,
        rate: storedRate,
      },
      wedding.currency,
      fallback,
    );
    if (estimated) {
      expense.set("currency", estimated.currency);
      expense.set("rate", estimated.rate);
      expense.set("baseEstimatedMinor", estimated.baseMinor);
      expense.set("baseActualMinor", actual?.baseMinor ?? null);
      if (estimated.currency !== wedding.currency) {
        wedding.rates.set(estimated.currency, estimated.rate);
        wedding.markModified("rates");
        await wedding.save();
      }
    }
    await expense.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "expense_updated",
      entityType: "expense",
      entityId: String(expense._id),
      message: `${authed.user.displayName} updated the expense "${expense.name}"`,
    });

    res.json({ expense: { id: String(expense._id) } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const expense = await Expense.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!expense) throw new NotFoundError("We couldn't find that expense.");

    await asSoftDeletable(expense).softDelete(authed.uid);

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "expense_deleted",
      entityType: "expense",
      message: `${authed.user.displayName} removed the expense "${expense.name}"`,
    });

    res.status(204).end();
  }),
);

export default router;
