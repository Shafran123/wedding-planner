import { describe, it, expect } from "vitest";
import {
  computeBudget,
  computeCategorySpend,
  paymentTotals,
} from "../../src/domain/money.js";

const AED = "AED";

describe("computeBudget", () => {
  it("derives committed, paid, remaining and percentage from expenses and payments", () => {
    // Budget AED 120,000 = 12,000,000 minor
    const result = computeBudget({
      totalBudgetMinor: 12_000_000,
      categories: [
        { id: "c1", name: "Venue", plannedMinor: 3_000_000 },
        { id: "c2", name: "Catering", plannedMinor: 2_000_000 },
      ],
      expenses: [
        {
          id: "e1",
          categoryId: "c1",
          status: "active",
          estimatedMinor: 3_000_000,
          paymentStatus: "partial",
        },
        {
          id: "e2",
          categoryId: "c2",
          status: "active",
          estimatedMinor: 2_000_000,
          paymentStatus: "unpaid",
        },
        {
          id: "e3",
          categoryId: "c1",
          status: "cancelled",
          estimatedMinor: 500_000,
          paymentStatus: "unpaid",
        },
      ],
      payments: [
        { id: "p1", expenseId: "e1", status: "paid", amountMinor: 2_000_000, dueDate: "2026-01-01" },
        { id: "p2", expenseId: "e1", status: "unpaid", amountMinor: 1_000_000, dueDate: "2026-06-01" },
        { id: "p3", expenseId: "e2", status: "paid", amountMinor: 800_000, dueDate: "2026-02-01" },
      ],
    });

    expect(result.committedMinor).toBe(5_000_000);
    expect(result.plannedMinor).toBe(5_000_000);
    expect(result.paidMinor).toBe(2_800_000);
    expect(result.remainingMinor).toBe(9_200_000);
    expect(result.percentUsed).toBeCloseTo(23.3, 1);
    expect(result.alerts).toHaveLength(0);
  });

  it("fires warning at 80%, critical at 90%, exceeded at 100%", () => {
    const base = {
      categories: [],
      expenses: [],
      payments: [] as { id: string; expenseId?: string; status: string; amountMinor: number; dueDate: string }[],
    };
    const at80 = computeBudget({
      totalBudgetMinor: 10_000_000,
      ...base,
      payments: [{ id: "p", status: "paid", amountMinor: 8_000_000, dueDate: "2026-01-01" }],
    });
    expect(at80.alerts.map((a) => a.level)).toEqual(["warning"]);

    const at90 = computeBudget({
      totalBudgetMinor: 10_000_000,
      ...base,
      payments: [{ id: "p", status: "paid", amountMinor: 9_000_000, dueDate: "2026-01-01" }],
    });
    expect(at90.alerts.map((a) => a.level)).toEqual(["warning", "critical"]);

    const at100 = computeBudget({
      totalBudgetMinor: 10_000_000,
      ...base,
      payments: [{ id: "p", status: "paid", amountMinor: 10_000_000, dueDate: "2026-01-01" }],
    });
    expect(at100.alerts.map((a) => a.level)).toEqual(["warning", "critical", "exceeded"]);
  });

  it("keeps percentUsed at 0 when there is no budget", () => {
    const result = computeBudget({
      totalBudgetMinor: 0,
      categories: [],
      expenses: [],
      payments: [{ id: "p", status: "paid", amountMinor: 100, dueDate: "2026-01-01" }],
    });
    expect(result.percentUsed).toBe(0);
    expect(result.remainingMinor).toBe(-100);
  });
});

describe("computeCategorySpend", () => {
  it("detects overspending with the excess amount", () => {
    const result = computeCategorySpend({
      categories: [
        { id: "c1", name: "Photography", plannedMinor: 800_000 },
        { id: "c2", name: "Catering", plannedMinor: 2_000_000 },
      ],
      expenses: [
        { id: "e1", categoryId: "c1", status: "active", estimatedMinor: 800_000, paymentStatus: "paid" },
        { id: "e2", categoryId: "c2", status: "active", estimatedMinor: 1_000_000, paymentStatus: "partial" },
      ],
      payments: [
        { id: "p1", expenseId: "e1", status: "paid", amountMinor: 920_000, dueDate: "2026-01-01" },
        { id: "p2", expenseId: "e2", status: "paid", amountMinor: 900_000, dueDate: "2026-01-01" },
      ],
    });

    const photography = result.find((c) => c.categoryId === "c1");
    const catering = result.find((c) => c.categoryId === "c2");
    expect(photography?.spentMinor).toBe(920_000);
    expect(photography?.overspentByMinor).toBe(120_000);
    expect(catering?.overspentByMinor).toBe(0);
  });

  it("ignores cancelled expenses and unpaid payments", () => {
    const result = computeCategorySpend({
      categories: [{ id: "c1", name: "Venue", plannedMinor: 3_000_000 }],
      expenses: [
        { id: "e1", categoryId: "c1", status: "active", estimatedMinor: 3_000_000, paymentStatus: "unpaid" },
        { id: "e2", categoryId: "c1", status: "cancelled", estimatedMinor: 9_000_000, paymentStatus: "unpaid" },
      ],
      payments: [
        { id: "p1", expenseId: "e1", status: "unpaid", amountMinor: 3_000_000, dueDate: "2026-01-01" },
        { id: "p2", expenseId: "e2", status: "paid", amountMinor: 9_000_000, dueDate: "2026-01-01" },
      ],
    });
    expect(result[0]?.spentMinor).toBe(0);
  });
});

describe("paymentTotals", () => {
  it("sums paid, upcoming and overdue", () => {
    const now = new Date("2026-08-01T00:00:00Z");
    const result = paymentTotals(
      [
        { id: "p1", status: "paid", amountMinor: 100_000, dueDate: "2026-05-01", paymentDate: "2026-05-01" },
        { id: "p2", status: "unpaid", amountMinor: 50_000, dueDate: "2026-09-01" },
        { id: "p3", status: "unpaid", amountMinor: 20_000, dueDate: "2026-07-15" },
        { id: "p4", status: "overdue", amountMinor: 5_000, dueDate: "2026-07-01" },
      ],
      now,
    );
    expect(result.paidMinor).toBe(100_000);
    expect(result.upcomingMinor).toBe(50_000);
    expect(result.overdueMinor).toBe(25_000);
  });
});
