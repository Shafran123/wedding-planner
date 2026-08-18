import { Wedding, BudgetCategory, Expense, Payment } from "../models/index.js";
import { iso } from "../routes/helpers.js";
import type { ComputeBudgetInput } from "../domain/money.js";

export async function buildBudgetInput(
  weddingId: string,
): Promise<ComputeBudgetInput> {
  const [wedding, categories, expenses, payments] = await Promise.all([
    Wedding.findById(weddingId).lean(),
    BudgetCategory.find({ weddingId }).lean(),
    Expense.find({ weddingId }).lean(),
    Payment.find({ weddingId }).lean(),
  ]);

  return {
    totalBudgetMinor: wedding?.totalBudgetMinor ?? 0,
    categories: categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      plannedMinor: c.plannedMinor,
    })),
    expenses: expenses.map((e) => ({
      id: String(e._id),
      categoryId: e.categoryId ? String(e.categoryId) : undefined,
      status: e.status,
      baseEstimatedMinor: e.baseEstimatedMinor ?? e.estimatedMinor,
      paymentStatus: e.paymentStatus,
    })),
    payments: payments.map((p) => ({
      id: String(p._id),
      expenseId: p.expenseId ? String(p.expenseId) : undefined,
      status: p.status,
      baseAmountMinor: p.baseAmountMinor ?? p.amountMinor,
      dueDate: iso(p.dueDate) as string,
    })),
  };
}
