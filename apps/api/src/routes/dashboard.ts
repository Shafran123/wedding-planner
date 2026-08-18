import { Router } from "express";
import type {
  DashboardData,
  Insight,
  Task as TaskDTO,
  Event as EventDTO,
  Payment as PaymentDTO,
  Activity as ActivityDTO,
} from "@wedding/shared";
import {
  Activity,
  BudgetCategory,
  Event,
  Expense,
  Member,
  Notification,
  Payment,
  Task,
  TaskCategory,
  Vendor,
  Wedding,
} from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { getCountdown } from "../domain/countdown.js";
import { computeBudget, computeCategorySpend } from "../domain/money.js";
import { ratesToObject } from "../domain/currency.js";
import { computeProgress } from "../domain/progress.js";
import { buildBudgetInput } from "../services/budget.js";
import { completionPercent, isOverdue } from "../domain/taskLogic.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { iso } from "./helpers.js";

const DAY_MS = 86_400_000;

function formatMoney(minor: number): string {
  return (minor / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const now = new Date();

    const [
      wedding,
      budgetInput,
      taskCategories,
      expenses,
      payments,
      tasks,
      events,
      members,
      activities,
      unread,
    ] = await Promise.all([
      Wedding.findById(authed.weddingId).lean(),
      buildBudgetInput(authed.weddingId),
      TaskCategory.find({ weddingId: authed.weddingId }).lean(),
      Expense.find({ weddingId: authed.weddingId }).lean(),
      Payment.find({ weddingId: authed.weddingId }).lean(),
      Task.find({ weddingId: authed.weddingId }).lean(),
      Event.find({ weddingId: authed.weddingId }).lean(),
      Member.find({ weddingId: authed.weddingId }).lean(),
      Activity.find({ weddingId: authed.weddingId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Notification.countDocuments({
        weddingId: authed.weddingId,
        userId: authed.uid,
        read: false,
      }),
    ]);
    if (!wedding) throw new NotFoundError("We couldn't find your wedding.");

    const taskCategoryNames = new Map(taskCategories.map((c) => [String(c._id), c.name]));
    const memberNames = new Map(members.map((m) => [m.userId, m.displayName]));

    const budget = computeBudget(budgetInput);
    const categorySpend = computeCategorySpend(budgetInput);

    const openTasks = tasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress",
    );
    const overdueTasks = openTasks.filter((t) => isOverdue({ status: t.status, dueDate: iso(t.dueDate) }, now));
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekEnd = todayStart.getTime() + 7 * DAY_MS;
    const dueThisWeek = openTasks.filter((t) => {
      const due = t.dueDate?.getTime();
      return due !== undefined && due >= todayStart.getTime() && due < weekEnd;
    }).length;

    const taskStats = {
      completed: tasks.filter((t) => t.status === "completed").length,
      total: tasks.filter((t) => t.status !== "cancelled").length,
      overdue: overdueTasks.length,
      dueThisWeek,
    };

    const progress = computeProgress(
      tasks.map((t) => ({
        id: String(t._id),
        title: t.title,
        status: t.status,
        categoryId: t.categoryId ? String(t.categoryId) : undefined,
      })),
      taskCategories.map((c) => ({ id: String(c._id), name: c.name })),
    );

    const upcomingTasks: TaskDTO[] = openTasks
      .filter((t) => t.dueDate)
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
      .slice(0, 5)
      .map((t) => ({
        id: String(t._id),
        weddingId: String(t.weddingId),
        title: t.title,
        categoryId: t.categoryId ? String(t.categoryId) : undefined,
        categoryName: t.categoryId
          ? taskCategoryNames.get(String(t.categoryId))
          : undefined,
        status: t.status,
        priority: t.priority,
        dueDate: iso(t.dueDate),
        assignedTo: t.assignedTo ?? undefined,
        createdAt: iso(t.createdAt) as string,
        updatedAt: iso(t.updatedAt) as string,
      }));

    const upcomingEvents: EventDTO[] = events
      .filter((e) => e.date.getTime() >= todayStart.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map((e) => ({
        id: String(e._id),
        weddingId: String(e.weddingId),
        name: e.name,
        type: e.type,
        date: iso(e.date) as string,
        startTime: e.startTime || undefined,
        status: e.status,
        createdAt: iso(e.createdAt) as string,
        updatedAt: iso(e.updatedAt) as string,
      }));

    const unpaidPayments = payments.filter((p) => p.status !== "paid");
    const upcomingPayments: PaymentDTO[] = unpaidPayments
      .filter((p) => p.dueDate.getTime() >= todayStart.getTime())
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5)
      .map((p) => ({
        id: String(p._id),
        weddingId: String(p.weddingId),
        vendorId: p.vendorId ? String(p.vendorId) : undefined,
        expenseId: p.expenseId ? String(p.expenseId) : undefined,
        amountMinor: p.amountMinor,
        currency: p.currency ?? "AED",
        rate: p.rate ?? 1,
        baseAmountMinor: p.baseAmountMinor ?? p.amountMinor,
        dueDate: iso(p.dueDate) as string,
        status: "unpaid",
        method: p.method,
        createdAt: iso(p.createdAt) as string,
        updatedAt: iso(p.updatedAt) as string,
      }));

    const recentActivity: ActivityDTO[] = activities.map((a) => ({
      id: String(a._id),
      weddingId: String(a.weddingId),
      actorId: a.actorId,
      actorName: a.actorName,
      type: a.type,
      entityType: a.entityType,
      entityId: a.entityId ? String(a.entityId) : undefined,
      message: a.message,
      createdAt: iso(a.createdAt) as string,
    }));

    const thirtyDaysAhead = todayStart.getTime() + 30 * DAY_MS;
    const dueIn30 = openTasks.filter((t) => {
      const due = t.dueDate?.getTime();
      return due !== undefined && due >= todayStart.getTime() && due < thirtyDaysAhead;
    }).length;
    const paymentsDueIn30 = unpaidPayments.filter((p) => {
      const due = p.dueDate.getTime();
      return due >= todayStart.getTime() && due < thirtyDaysAhead;
    });
    const riskOverdue = overdueTasks.filter(
      (t) => t.priority === "high" || t.priority === "urgent",
    ).length;

    const insights: Insight[] = [];
    if (budget.totalBudgetMinor > 0 && budget.paidMinor > 0) {
      insights.push({
        kind: "budget",
        message: `You've spent ${Math.round(budget.percentUsed)}% of your budget.`,
        actionUrl: "/budget",
      });
    }
    if (dueIn30 > 0) {
      insights.push({
        kind: "planning",
        message: `${dueIn30} task${dueIn30 === 1 ? "" : "s"} due in the next 30 days.`,
        actionUrl: "/tasks",
      });
    }
    const upcomingPaymentsMinor = paymentsDueIn30.reduce(
      (sum, p) => sum + (p.baseAmountMinor ?? p.amountMinor),
      0,
    );
    if (upcomingPaymentsMinor > 0) {
      insights.push({
        kind: "payments",
        message: `${wedding.currency} ${formatMoney(upcomingPaymentsMinor)} is due in the next 30 days.`,
        actionUrl: "/budget/payments",
      });
    }
    if (riskOverdue > 0) {
      insights.push({
        kind: "risk",
        message: `${riskOverdue} high-priority task${riskOverdue === 1 ? "" : "s"} overdue.`,
        actionUrl: "/tasks",
      });
    }

    const dashboard: DashboardData = {
      wedding: {
        id: String(wedding._id),
        ownerId: wedding.ownerId,
        weddingName: wedding.weddingName,
        partnerOneName: wedding.partnerOneName,
        partnerTwoName: wedding.partnerTwoName,
        weddingDate: iso(wedding.weddingDate) as string,
        timezone: wedding.timezone,
        currency: wedding.currency,
        estimatedGuestCount: wedding.estimatedGuestCount ?? undefined,
        totalBudgetMinor: wedding.totalBudgetMinor,
        weddingType: wedding.weddingType ?? undefined,
        location: wedding.location ?? undefined,
        coverImageUrl: wedding.coverImageUrl ?? undefined,
        plan: wedding.plan ?? undefined,
        rates: ratesToObject(
          wedding.rates as Map<string, number> | Record<string, number> | null | undefined,
        ),
        createdAt: iso(wedding.createdAt) as string,
        updatedAt: iso(wedding.updatedAt) as string,
      },
      role: authed.role,
      countdown: getCountdown({
        weddingDate: iso(wedding.weddingDate) as string,
        timezone: wedding.timezone,
        now,
      }),
      budget,
      categorySpend,
      taskStats,
      progress,
      upcomingTasks,
      upcomingEvents,
      upcomingPayments,
      recentActivity,
      insights,
      unreadNotifications: unread,
    };

    res.json({ dashboard });
  }),
);

export default router;
