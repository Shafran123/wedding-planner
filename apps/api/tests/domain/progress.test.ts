import { describe, it, expect } from "vitest";
import { computeProgress } from "../../src/domain/progress.js";

describe("computeProgress", () => {
  it("computes overall completion excluding cancelled tasks", () => {
    const tasks = [
      { id: "t1", title: "a", status: "completed", categoryId: "c1" },
      { id: "t2", title: "b", status: "completed", categoryId: "c1" },
      { id: "t3", title: "c", status: "in_progress", categoryId: "c1" },
      { id: "t4", title: "d", status: "todo", categoryId: "c2" },
      { id: "t5", title: "e", status: "todo", categoryId: "c2" },
      { id: "t6", title: "f", status: "todo", categoryId: "c2" },
      { id: "t7", title: "g", status: "cancelled", categoryId: "c1" },
    ];
    const result = computeProgress(tasks, [{ id: "c1", name: "Venue" }, { id: "c2", name: "Catering" }]);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(6);
    expect(result.percent).toBeCloseTo(33.3, 1);
  });

  it("computes per-category progress", () => {
    const tasks = [
      { id: "t1", title: "a", status: "completed", categoryId: "c1" },
      { id: "t2", title: "b", status: "todo", categoryId: "c1" },
      { id: "t3", title: "c", status: "completed", categoryId: "c2" },
    ];
    const result = computeProgress(tasks, [{ id: "c1", name: "Venue" }, { id: "c2", name: "Catering" }]);
    const venue = result.byCategory.find((c) => c.categoryId === "c1");
    const catering = result.byCategory.find((c) => c.categoryId === "c2");
    expect(venue?.percent).toBe(50);
    expect(catering?.percent).toBe(100);
  });

  it("handles zero tasks without dividing by zero", () => {
    const result = computeProgress([], []);
    expect(result.total).toBe(0);
    expect(result.percent).toBe(0);
  });
});
