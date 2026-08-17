import { Router } from "express";
import { paymentSchema, paymentUpdateSchema } from "@wedding/shared";
import type { Payment as PaymentDTO } from "@wedding/shared";
import {
  BudgetCategory,
  Expense,
  Payment,
  Vendor,
  Wedding,
} from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { computeBudget } from "../domain/money.js";
import { writeActivity } from "../services/activity.js";
import {
  maybeNotifyBudgetThresholds,
  maybeNotifyPaymentDue,
} from "../services/notifications.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, cleanString, iso, validate } from "./helpers.js";
import { asSoftDeletable } from "../models/softDelete.js";

const DAY_MS = 86_400_000;

function effectiveStatus(doc: { status: string; dueDate: Date }, now: Date): PaymentDTO["status"] {
  if (doc.status === "unpaid") {
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (doc.dueDate.getTime() < todayStart) return "overdue";
  }
  return doc.status as PaymentDTO["status"];
}

function serializePayment(
  doc: Record<string, unknown>,
  vendorNames: Map<string, string>,
  expenseNames: Map<string, string>,
  now: Date,
): PaymentDTO {
  const vendorId = doc.vendorId ? String(doc.vendorId) : undefined;
  const expenseId = doc.expenseId ? String(doc.expenseId) : undefined;
  const dueDate = doc.dueDate as Date;
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    vendorId,
    vendorName: vendorId ? vendorNames.get(vendorId) : undefined,
    expenseId,
    expenseName: expenseId ? expenseNames.get(expenseId) : undefined,
    amountMinor: doc.amountMinor as number,
    paymentDate: iso(doc.paymentDate as Date | null),
    dueDate: dueDate.toISOString(),
    status: effectiveStatus({ status: doc.status as string, dueDate }, now),
    method: doc.method as PaymentDTO["method"],
    reference: (doc.reference as string) || undefined,
    notes: (doc.notes as string) || undefined,
    createdAt: iso(doc.createdAt as Date) as string,
    updatedAt: iso(doc.updatedAt as Date) as string,
  };
}

async function recomputeExpenseSnapshot(expenseId: string): Promise<void> {
  const expense = await Expense.findById(expenseId);
  if (!expense) return;
  const payments = await Payment.find({ expenseId, status: { $ne: "unpaid" } }).lean();
  const paidMinor = payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const expected = expense.estimatedMinor;

  if (paidMinor >= expected && expected > 0) {
    expense.set("paymentStatus", "paid");
  } else if (paidMinor > 0) {
    expense.set("paymentStatus", "partial");
  } else if (expense.dueDate && expense.dueDate.getTime() < Date.now()) {
    expense.set("paymentStatus", "overdue");
  } else {
    expense.set("paymentStatus", "unpaid");
  }
  await expense.save();
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const filter: Record<string, unknown> = { weddingId: authed.weddingId };
    if (req.query.vendorId) filter.vendorId = req.query.vendorId;
    if (req.query.expenseId) filter.expenseId = req.query.expenseId;
    if (req.query.status === "overdue") {
      filter.status = "unpaid";
      filter.dueDate = { $lt: new Date() };
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    const now = new Date();
    const [payments, vendors, expenses] = await Promise.all([
      Payment.find(filter).limit(500).lean(),
      Vendor.find({ weddingId: authed.weddingId }).lean(),
      Expense.find({ weddingId: authed.weddingId }).lean(),
    ]);
    const vendorNames = new Map(vendors.map((v) => [String(v._id), v.name]));
    const expenseNames = new Map(expenses.map((e) => [String(e._id), e.name]));

    const serialized = payments
      .map((p) =>
        serializePayment(p as unknown as Record<string, unknown>, vendorNames, expenseNames, now),
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    res.json({ payments: serialized });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(paymentSchema, req.body);

    const payment = await Payment.create({
      weddingId: authed.weddingId,
      vendorId: cleanString(input.vendorId) ?? null,
      expenseId: cleanString(input.expenseId) ?? null,
      amountMinor: input.amountMinor,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
      dueDate: new Date(input.dueDate),
      status: input.status,
      method: input.method,
      reference: input.reference ?? "",
      notes: input.notes ?? "",
    });

    if (payment.expenseId) {
      await recomputeExpenseSnapshot(String(payment.expenseId));
    }

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: input.status === "paid" ? "payment_paid" : "payment_created",
      entityType: "payment",
      entityId: String(payment._id),
      message: `${authed.user.displayName} recorded a payment`,
    });

    await maybeNotifyPaymentDue(authed.weddingId, payment.toObject(), authed.uid);

    res.status(201).json({ payment: { id: String(payment._id) } });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(paymentUpdateSchema, req.body);

    const payment = await Payment.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!payment) throw new NotFoundError("We couldn't find that payment.");

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "dueDate" || key === "paymentDate") {
        payment.set(key, value ? new Date(value as string) : null);
      } else if (key === "vendorId" || key === "expenseId") {
        payment.set(key, cleanString(value as string) ?? null);
      } else {
        payment.set(key, value);
      }
    }
    await payment.save();

    if (payment.expenseId) {
      await recomputeExpenseSnapshot(String(payment.expenseId));
    }

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: payment.status === "paid" ? "payment_paid" : "payment_updated",
      entityType: "payment",
      entityId: String(payment._id),
      message:
        payment.status === "paid"
          ? `${authed.user.displayName} marked a payment as paid`
          : `${authed.user.displayName} updated a payment`,
    });

    res.json({ payment: { id: String(payment._id) } });
  }),
);

router.post(
  "/:id/paid",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const payment = await Payment.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!payment) throw new NotFoundError("We couldn't find that payment.");

    payment.status = "paid";
    if (!payment.paymentDate) payment.paymentDate = new Date();
    await payment.save();

    if (payment.expenseId) {
      await recomputeExpenseSnapshot(String(payment.expenseId));
    }

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "payment_paid",
      entityType: "payment",
      entityId: String(payment._id),
      message: `${authed.user.displayName} marked a payment as paid`,
    });

    const [wedding, expenses, payments, categories] = await Promise.all([
      Wedding.findById(authed.weddingId).lean(),
      Expense.find({ weddingId: authed.weddingId }).lean(),
      Payment.find({ weddingId: authed.weddingId }).lean(),
      BudgetCategory.find({ weddingId: authed.weddingId }).lean(),
    ]);
    if (wedding) {
      const budget = computeBudget({
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
      });
      await maybeNotifyBudgetThresholds(
        authed.weddingId,
        budget.percentUsed,
        authed.uid,
      );
    }

    res.json({ payment: { id: String(payment._id), status: "paid" } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const payment = await Payment.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!payment) throw new NotFoundError("We couldn't find that payment.");

    const expenseId = payment.expenseId ? String(payment.expenseId) : null;
    await asSoftDeletable(payment).softDelete(authed.uid);
    if (expenseId) {
      await recomputeExpenseSnapshot(expenseId);
    }

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "payment_deleted",
      entityType: "payment",
      message: `${authed.user.displayName} removed a payment`,
    });

    res.status(204).end();
  }),
);

export default router;
