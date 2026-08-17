import { TASK_TEMPLATES } from "@wedding/shared";

export interface GeneratedTask {
  title: string;
  category: string;
  dueDate: string;
  status: "todo";
  priority: "medium";
}

export function generateTemplateTasks(
  weddingDate: string,
  now: Date = new Date(),
): GeneratedTask[] {
  const wedding = new Date(weddingDate);
  const todayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return TASK_TEMPLATES.map((template) => {
    const due = new Date(wedding);
    due.setUTCMonth(due.getUTCMonth() - template.offsetMonths);
    due.setUTCHours(9, 0, 0, 0);
    if (due.getTime() < todayStart) {
      due.setTime(todayStart);
    }
    return {
      title: template.title,
      category: template.category,
      dueDate: due.toISOString(),
      status: "todo" as const,
      priority: "medium" as const,
    };
  });
}
