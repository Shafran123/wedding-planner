import { describe, it, expect } from "vitest";
import { dueWindow, completionPercent, isOverdue } from "../../src/domain/taskLogic.js";

const NOW = new Date("2026-08-17T08:00:00Z");

describe("dueWindow", () => {
  it("classifies overdue, today, 1d, 3d, 7d, future and none", () => {
    expect(dueWindow("2026-08-16", NOW)).toBe("overdue");
    expect(dueWindow("2026-08-17T23:00:00Z", NOW)).toBe("today");
    expect(dueWindow("2026-08-18", NOW)).toBe("soon-1d");
    expect(dueWindow("2026-08-19", NOW)).toBe("soon-3d");
    expect(dueWindow("2026-08-23", NOW)).toBe("soon-7d");
    expect(dueWindow("2026-09-01", NOW)).toBe("future");
    expect(dueWindow(undefined, NOW)).toBe("none");
  });
});

describe("isOverdue", () => {
  it("only counts incomplete tasks past their due date", () => {
    expect(isOverdue({ status: "todo", dueDate: "2026-08-16" }, NOW)).toBe(true);
    expect(isOverdue({ status: "in_progress", dueDate: "2026-08-16" }, NOW)).toBe(true);
    expect(isOverdue({ status: "completed", dueDate: "2026-08-16" }, NOW)).toBe(false);
    expect(isOverdue({ status: "cancelled", dueDate: "2026-08-16" }, NOW)).toBe(false);
    expect(isOverdue({ status: "todo", dueDate: "2026-08-18" }, NOW)).toBe(false);
    expect(isOverdue({ status: "todo" }, NOW)).toBe(false);
  });
});

describe("completionPercent", () => {
  it("computes completed over non-cancelled", () => {
    const tasks = [
      { status: "completed" },
      { status: "completed" },
      { status: "todo" },
      { status: "in_progress" },
      { status: "cancelled" },
    ];
    expect(completionPercent(tasks)).toBe(50);
  });
});
