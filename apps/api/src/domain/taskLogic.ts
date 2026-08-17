export type DueWindow =
  | "overdue"
  | "today"
  | "soon-1d"
  | "soon-3d"
  | "soon-7d"
  | "future"
  | "none";

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function dueWindow(
  dueDate: string | undefined,
  now: Date = new Date(),
): DueWindow {
  if (!dueDate) return "none";

  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return "none";

  const dueDay = new Date(due);
  dueDay.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDay.getTime() - startOfUtcDay(now)) / 86_400_000);

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "soon-1d";
  if (diffDays <= 3) return "soon-3d";
  if (diffDays <= 7) return "soon-7d";
  return "future";
}

export function isOverdue(
  task: { status: string; dueDate?: string },
  now: Date = new Date(),
): boolean {
  if (task.status !== "todo" && task.status !== "in_progress") return false;
  return dueWindow(task.dueDate, now) === "overdue";
}

export function completionPercent(tasks: { status: string }[]): number {
  const active = tasks.filter((task) => task.status !== "cancelled");
  if (active.length === 0) return 0;
  const completed = active.filter((task) => task.status === "completed").length;
  return Math.round((completed / active.length) * 100);
}
