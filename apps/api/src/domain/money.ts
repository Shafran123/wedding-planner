import type { BudgetAlert, BudgetTotals, CategorySpend } from "@wedding/shared";

export interface BudgetCategoryInput {
  id: string;
  name: string;
  plannedMinor: number;
}

export interface ExpenseInput {
  id: string;
  categoryId?: string;
  status: string;
  estimatedMinor: number;
  paymentStatus?: string;
}

export interface PaymentInput {
  id: string;
  expenseId?: string;
  status: string;
  amountMinor: number;
  dueDate: string;
  paymentDate?: string;
}

export interface ComputeBudgetInput {
  totalBudgetMinor: number;
  categories: BudgetCategoryInput[];
  expenses: ExpenseInput[];
  payments: PaymentInput[];
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeBudget(input: ComputeBudgetInput): BudgetTotals {
  const plannedMinor = input.categories.reduce((sum, c) => sum + c.plannedMinor, 0);
  const committedMinor = input.expenses
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + e.estimatedMinor, 0);
  const paidMinor = input.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountMinor, 0);

  const remainingMinor = input.totalBudgetMinor - paidMinor;
  const percentUsed =
    input.totalBudgetMinor > 0
      ? round1((paidMinor / input.totalBudgetMinor) * 100)
      : 0;

  const alerts: BudgetAlert[] = [];
  if (percentUsed >= 80) {
    alerts.push({
      level: "warning",
      message: `You have used ${Math.round(percentUsed)}% of your budget.`,
    });
  }
  if (percentUsed >= 90) {
    alerts.push({
      level: "critical",
      message: `You have used ${Math.round(percentUsed)}% of your budget.`,
    });
  }
  if (percentUsed >= 100) {
    alerts.push({
      level: "exceeded",
      message: "You have used your entire budget.",
    });
  }

  return {
    totalBudgetMinor: input.totalBudgetMinor,
    plannedMinor,
    committedMinor,
    paidMinor,
    remainingMinor,
    percentUsed,
    alerts,
  };
}

export function computeCategorySpend(
  input: Omit<ComputeBudgetInput, "totalBudgetMinor">,
): CategorySpend[] {
  const categoryOfExpense = new Map<string, string>();
  for (const expense of input.expenses) {
    if (expense.status === "active" && expense.categoryId) {
      categoryOfExpense.set(expense.id, expense.categoryId);
    }
  }

  const spentByCategory = new Map<string, number>();
  for (const payment of input.payments) {
    if (payment.status !== "paid" || !payment.expenseId) continue;
    const categoryId = categoryOfExpense.get(payment.expenseId);
    if (!categoryId) continue;
    spentByCategory.set(
      categoryId,
      (spentByCategory.get(categoryId) ?? 0) + payment.amountMinor,
    );
  }

  return input.categories.map((category) => {
    const spentMinor = spentByCategory.get(category.id) ?? 0;
    return {
      categoryId: category.id,
      name: category.name,
      plannedMinor: category.plannedMinor,
      spentMinor,
      overspentByMinor: Math.max(0, spentMinor - category.plannedMinor),
    };
  });
}

export function paymentTotals(
  payments: PaymentInput[],
  now: Date = new Date(),
): { paidMinor: number; upcomingMinor: number; overdueMinor: number } {
  const todayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  let paidMinor = 0;
  let upcomingMinor = 0;
  let overdueMinor = 0;

  for (const payment of payments) {
    if (payment.status === "paid") {
      paidMinor += payment.amountMinor;
      continue;
    }
    const due = new Date(payment.dueDate).getTime();
    if (Number.isNaN(due)) continue;
    if (due < todayStart) {
      overdueMinor += payment.amountMinor;
    } else {
      upcomingMinor += payment.amountMinor;
    }
  }

  return { paidMinor, upcomingMinor, overdueMinor };
}
