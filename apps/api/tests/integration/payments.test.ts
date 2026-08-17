import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createApp } from "../../src/app.js";
import { Activity, Expense, Notification, Payment } from "../../src/models/index.js";
import {
  authHeader,
  connectTestDb,
  disconnectTestDb,
  onboardingBody,
  request,
  resetDb,
} from "./helpers.js";

const app = createApp();
const A = authHeader("a", "owner@test.com", "Owner A");

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

async function setupBudget(): Promise<{ categoryId: string; expenseId: string }> {
  await request(app)
    .post("/api/onboarding")
    .set(A)
    .send(onboardingBody({ totalBudgetMinor: 10_000_000 }));

  const budget = await request(app).get("/api/budget").set(A);
  const category = (budget.body.categories as { id: string; name: string }[]).find(
    (c) => c.name === "Photography",
  );
  const categoryId = category!.id;

  await request(app)
    .put(`/api/budget/categories/${categoryId}`)
    .set(A)
    .send({ plannedMinor: 800_000 });

  const expense = await request(app)
    .post("/api/expenses")
    .set(A)
    .send({ name: "Photographer", categoryId, estimatedMinor: 1_000_000 });

  return { categoryId, expenseId: expense.body.expense.id as string };
}

describe("payment recording", () => {
  it("keeps payment, expense snapshot and activity consistent", async () => {
    const { expenseId } = await setupBudget();

    const created = await request(app)
      .post("/api/payments")
      .set(A)
      .send({ expenseId, amountMinor: 600_000, dueDate: "2026-10-01" });
    expect(created.status).toBe(201);
    const paymentId = created.body.payment.id as string;

    const marked = await request(app)
      .post(`/api/payments/${paymentId}/paid`)
      .set(A);
    expect(marked.status).toBe(200);

    const expense = await Expense.findById(expenseId).lean();
    expect(expense?.paymentStatus).toBe("partial");

    const activity = await Activity.findOne({ entityType: "payment" }).sort({ createdAt: -1 }).lean();
    expect(activity?.message).toContain("marked a payment as paid");

    const payment = await Payment.findById(paymentId).lean();
    expect(payment?.status).toBe("paid");
    expect(payment?.paymentDate).toBeTruthy();
  });

  it("reflects paid amounts in the budget totals", async () => {
    const { expenseId } = await setupBudget();

    await request(app)
      .post("/api/payments")
      .set(A)
      .send({ expenseId, amountMinor: 500_000, dueDate: "2026-10-01" })
      .then(async (res) => {
        await request(app)
          .post(`/api/payments/${res.body.payment.id}/paid`)
          .set(A);
      });

    const budget = await request(app).get("/api/budget").set(A);
    expect(budget.body.budget.paidMinor).toBe(500_000);
    expect(budget.body.budget.remainingMinor).toBe(9_500_000);
    expect(budget.body.budget.committedMinor).toBe(1_000_000);
  });

  it("soft-deleted payments disappear from totals", async () => {
    const { expenseId } = await setupBudget();

    const created = await request(app)
      .post("/api/payments")
      .set(A)
      .send({ expenseId, amountMinor: 900_000, dueDate: "2026-10-01" });
    const paymentId = created.body.payment.id as string;

    await request(app).post(`/api/payments/${paymentId}/paid`).set(A);

    const before = await request(app).get("/api/budget").set(A);
    expect(before.body.budget.paidMinor).toBe(900_000);

    const del = await request(app).delete(`/api/payments/${paymentId}`).set(A);
    expect(del.status).toBe(204);

    const after = await request(app).get("/api/budget").set(A);
    expect(after.body.budget.paidMinor).toBe(0);

    const snapshot = await Expense.findById(expenseId).lean();
    expect(snapshot?.paymentStatus).toBe("unpaid");
  });

  it("notifies when the budget crosses 80%", async () => {
    const { expenseId } = await setupBudget();

    const created = await request(app)
      .post("/api/payments")
      .set(A)
      .send({ expenseId, amountMinor: 8_500_000, dueDate: "2026-10-01" });
    await request(app)
      .post(`/api/payments/${created.body.payment.id}/paid`)
      .set(A);

    const notification = await Notification.findOne({
      type: "budget_exceeded",
    }).lean();
    expect(notification).toBeTruthy();
    expect(notification?.title).toBe("Budget alert");
  });

  it("notifies when a payment is due within 7 days", async () => {
    const { expenseId } = await setupBudget();

    const inSixDays = new Date(Date.now() + 6 * 86_400_000).toISOString();
    await request(app)
      .post("/api/payments")
      .set(A)
      .send({ expenseId, amountMinor: 100_000, dueDate: inSixDays });

    const notification = await Notification.findOne({
      type: "payment_due",
    }).lean();
    expect(notification).toBeTruthy();
  });
});

describe("review fixes", () => {
  it("notifies when a payment is created already-paid", async () => {
    const { expenseId } = await setupBudget();

    await request(app)
      .post("/api/payments")
      .set(A)
      .send({ expenseId, amountMinor: 8_600_000, dueDate: "2026-10-01", status: "paid" });

    const notification = await Notification.findOne({ type: "budget_exceeded" }).lean();
    expect(notification).toBeTruthy();
  });

  it("does not count unpaid overdue payments toward the expense snapshot", async () => {
    const { expenseId } = await setupBudget();

    await request(app)
      .post("/api/payments")
      .set(A)
      .send({ expenseId, amountMinor: 900_000, dueDate: "2020-01-01" });

    const expense = await Expense.findById(expenseId).lean();
    expect(expense?.paymentStatus).toBe("unpaid");
  });
});
