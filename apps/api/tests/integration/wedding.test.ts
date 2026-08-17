import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../../src/app.js";
import {
  BudgetCategory,
  Member,
  Task,
  TaskCategory,
  Wedding,
} from "../../src/models/index.js";
import {
  authHeader,
  connectTestDb,
  disconnectTestDb,
  onboardingBody,
  request,
  resetDb,
} from "./helpers.js";

const app = createApp();

beforeAll(async () => {
  await connectTestDb();
  await resetDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("onboarding", () => {
  it("creates a wedding with owner, categories and template tasks", async () => {
    const res = await request(app)
      .post("/api/onboarding")
      .set(authHeader("u1", "sarah@test.com", "Sarah"))
      .send(onboardingBody());

    expect(res.status).toBe(201);
    const weddingId = res.body.weddingId as string;
    expect(weddingId).toBeTruthy();

    const wedding = await Wedding.findById(weddingId).lean();
    expect(wedding?.totalBudgetMinor).toBe(12_000_000);
    expect(wedding?.currency).toBe("AED");

    const member = await Member.findOne({ weddingId, userId: "u1" }).lean();
    expect(member?.role).toBe("owner");

    expect(await BudgetCategory.countDocuments({ weddingId })).toBeGreaterThan(15);
    expect(await TaskCategory.countDocuments({ weddingId })).toBeGreaterThan(15);
    expect(await Task.countDocuments({ weddingId })).toBeGreaterThan(30);
  });

  it("refuses a second onboarding for the same user", async () => {
    const res = await request(app)
      .post("/api/onboarding")
      .set(authHeader("u1", "sarah@test.com", "Sarah"))
      .send(onboardingBody({ weddingName: "Another" }));
    expect(res.status).toBe(409);
  });

  it("rejects an invalid budget amount", async () => {
    const res = await request(app)
      .post("/api/onboarding")
      .set(authHeader("u9", "new@test.com", "New"))
      .send(onboardingBody({ totalBudgetMinor: -100 }));
    expect(res.status).toBe(400);
  });
});

describe("wedding + dashboard", () => {
  it("returns the wedding with the caller's role", async () => {
    const res = await request(app)
      .get("/api/wedding")
      .set(authHeader("u1", "sarah@test.com", "Sarah"));
    expect(res.status).toBe(200);
    expect(res.body.wedding.weddingName).toBe("Sarah & Ahmed");
    expect(res.body.role).toBe("owner");
  });

  it("returns a rich dashboard", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set(authHeader("u1", "sarah@test.com", "Sarah"));
    expect(res.status).toBe(200);
    const d = res.body.dashboard;
    expect(d.wedding.weddingName).toBe("Sarah & Ahmed");
    expect(d.countdown.days).toBeGreaterThan(0);
    expect(d.budget.totalBudgetMinor).toBe(12_000_000);
    expect(d.budget.plannedMinor).toBe(0);
    expect(d.taskStats.total).toBeGreaterThan(30);
    expect(d.taskStats.completed).toBe(0);
    expect(d.upcomingTasks.length).toBe(5);
    expect(d.insights.length).toBeGreaterThan(0);
  });
});
