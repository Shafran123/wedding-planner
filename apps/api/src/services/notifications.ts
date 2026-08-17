import type { NotificationType } from "@wedding/shared";
import { Member, Notification } from "../models/index.js";
import { buildBudgetInput } from "./budget.js";
import { computeBudget } from "../domain/money.js";

const DAY_MS = 86_400_000;

export async function notifyMembers(
  weddingId: string,
  input: { type: NotificationType; title: string; message: string; exceptUserId?: string },
): Promise<void> {
  const members = await Member.find({ weddingId }).lean();
  const targets = members.map((m) => ({
    weddingId,
    userId: m.userId,
    type: input.type,
    title: input.title,
    message: input.message,
  }));
  if (targets.length > 0) {
    await Notification.insertMany(targets);
  }
}

export async function maybeNotifyPaymentDue(
  weddingId: string,
  payment: { dueDate: Date; status: string },
  actorId: string,
): Promise<void> {
  if (payment.status === "paid") return;
  const now = Date.now();
  const due = payment.dueDate.getTime();
  if (due >= now && due <= now + 7 * DAY_MS) {
    await notifyMembers(weddingId, {
      type: "payment_due",
      title: "Payment due soon",
      message: "A payment is due within the next 7 days.",
      exceptUserId: actorId,
    });
  }
}

export async function maybeNotifyBudgetThresholds(
  weddingId: string,
  percentUsed: number,
  actorId: string,
): Promise<void> {
  if (percentUsed < 80) return;
  const existing = await Notification.exists({
    weddingId,
    type: "budget_exceeded",
    read: false,
  });
  if (existing) return;
  await notifyMembers(weddingId, {
    type: "budget_exceeded",
    title: "Budget alert",
    message:
      percentUsed >= 100
        ? "You have used your entire wedding budget."
        : `You have used ${Math.round(percentUsed)}% of your wedding budget.`,
    exceptUserId: actorId,
  });
}

/** Recompute the budget after a payment changed and notify on threshold crossings. */
export async function notifyBudgetAfterPaymentChange(
  weddingId: string,
  actorId: string,
): Promise<void> {
  const budgetInput = await buildBudgetInput(weddingId);
  const budget = computeBudget(budgetInput);
  await maybeNotifyBudgetThresholds(weddingId, budget.percentUsed, actorId);
}

export async function maybeNotifyEventUpcoming(
  weddingId: string,
  event: { date: Date; name: string },
  actorId: string,
): Promise<void> {
  const now = Date.now();
  const when = event.date.getTime();
  if (when >= now && when <= now + 7 * DAY_MS) {
    await notifyMembers(weddingId, {
      type: "event_upcoming",
      title: "Event coming up",
      message: `${event.name} is within the next 7 days.`,
      exceptUserId: actorId,
    });
  }
}
