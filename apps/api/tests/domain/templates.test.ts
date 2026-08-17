import { describe, it, expect } from "vitest";
import { generateTemplateTasks } from "../../src/domain/templates.js";

describe("generateTemplateTasks", () => {
  it("generates all template tasks with deadlines offset from the wedding date", () => {
    const weddingDate = "2026-12-24T16:00:00+04:00";
    const now = new Date("2025-08-17T08:00:00Z");
    const tasks = generateTemplateTasks(weddingDate, now);

    expect(tasks.length).toBeGreaterThan(30);

    const setBudget = tasks.find((t) => t.title === "Set your budget");
    expect(setBudget).toBeDefined();
    expect(setBudget?.category).toBe("Venue");
    // 12 months before the wedding → mid-Dec 2025, after "now".
    expect(new Date(setBudget!.dueDate).getUTCFullYear()).toBe(2025);
    expect(new Date(setBudget!.dueDate).getUTCMonth()).toBe(11);

    const packItems = tasks.find((t) => t.title === "Pack wedding items");
    // Offset 0 → on the wedding date itself.
    expect(packItems?.dueDate.slice(0, 10)).toBe("2026-12-24");
  });

  it("clamps deadlines already in the past to today", () => {
    const weddingDate = "2026-08-30T16:00:00+04:00";
    const now = new Date("2026-08-17T08:00:00Z");
    const tasks = generateTemplateTasks(weddingDate, now);
    for (const task of tasks) {
      expect(new Date(task.dueDate).getTime()).toBeGreaterThanOrEqual(
        new Date("2026-08-17T00:00:00Z").getTime(),
      );
    }
  });

  it("uses the task's template category name", () => {
    const tasks = generateTemplateTasks("2026-12-24T16:00:00+04:00", new Date("2025-08-17T08:00:00Z"));
    const photographer = tasks.find((t) => t.title === "Book photographer");
    expect(photographer?.category).toBe("Photography");
  });
});
