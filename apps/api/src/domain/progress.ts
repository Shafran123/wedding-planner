import type { PlanningProgress, ProgressByCategory } from "@wedding/shared";
import { round1 } from "./money.js";

export interface TaskLike {
  id: string;
  title: string;
  status: string;
  categoryId?: string;
}

export interface CategoryLike {
  id: string;
  name: string;
}

export function computeProgress(
  tasks: TaskLike[],
  categories: CategoryLike[],
): PlanningProgress {
  const active = tasks.filter((task) => task.status !== "cancelled");
  const completed = active.filter((task) => task.status === "completed").length;
  const total = active.length;
  const percent = total > 0 ? round1((completed / total) * 100) : 0;

  const byCategory: ProgressByCategory[] = [];
  const names = new Map(categories.map((c) => [c.id, c.name]));

  const grouped = new Map<string, { completed: number; total: number }>();
  for (const task of active) {
    const key = task.categoryId ?? "";
    const entry = grouped.get(key) ?? { completed: 0, total: 0 };
    entry.total += 1;
    if (task.status === "completed") entry.completed += 1;
    grouped.set(key, entry);
  }

  for (const [categoryId, entry] of grouped) {
    if (entry.total === 0) continue;
    byCategory.push({
      categoryId,
      name: categoryId ? (names.get(categoryId) ?? "Other") : "Other",
      completed: entry.completed,
      total: entry.total,
      percent: round1((entry.completed / entry.total) * 100),
    });
  }

  byCategory.sort((a, b) => a.name.localeCompare(b.name));

  return { completed, total, percent, byCategory };
}
