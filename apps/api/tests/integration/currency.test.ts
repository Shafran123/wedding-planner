import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../../src/app.js";
import { BudgetCategory, Expense, TaskCategory, Wedding } from "../../src/models/index.js";
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
  await request(app)
    .post("/api/onboarding")
    .set(authHeader("u1", "sarah@test.com", "Sarah"))
    .send(onboardingBody());
});

afterAll(async () => {
  await disconnectTestDb();
});

const header = () => authHeader("u1", "sarah@test.com", "Sarah");

describe("multi-currency expenses", () => {
  let categoryId = "";

  it("stores currency, rate and base snapshot for an LKR expense", async () => {
    const budget = await request(app).get("/api/budget").set(header());
    categoryId = budget.body.categories[0].id as string;

    const res = await request(app)
      .post("/api/expenses")
      .set(header())
      .send({
        name: "Flower arch",
        categoryId,
        estimatedMinor: 100_000,
        currency: "LKR",
        rate: 0.0122,
      });
    expect(res.status).toBe(201);

    const list = await request(app).get("/api/expenses").set(header());
    const expense = list.body.expenses.find(
      (e: { name: string }) => e.name === "Flower arch",
    );
    expect(expense.currency).toBe("LKR");
    expect(expense.rate).toBe(0.0122);
    expect(expense.baseEstimatedMinor).toBe(1_220);
    expect(expense.estimatedMinor).toBe(100_000);
  });

  it("remembers the last-used rate on the wedding", async () => {
    const res = await request(app).get("/api/wedding").set(header());
    expect(res.body.wedding.rates?.LKR).toBe(0.0122);
  });

  it("falls back to the stored rate when the client omits it", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(header())
      .send({ name: "Garland", estimatedMinor: 50_000, currency: "LKR" });
    expect(res.status).toBe(201);

    const list = await request(app).get("/api/expenses").set(header());
    const expense = list.body.expenses.find(
      (e: { name: string }) => e.name === "Garland",
    );
    expect(expense.baseEstimatedMinor).toBe(610);
  });

  it("sums budget totals in the base currency", async () => {
    const res = await request(app).get("/api/budget").set(header());
    // 1,220 + 610 = 1,830 base minor
    expect(res.body.budget.committedMinor).toBe(1_830);
  });

  it("rejects a foreign amount with no rate anywhere", async () => {
    const wedding = await Wedding.findOne({ ownerId: "u1" });
    if (wedding) {
      wedding.rates = new Map();
      await wedding.save();
    }
    const res = await request(app)
      .post("/api/expenses")
      .set(header())
      .send({ name: "No rate", estimatedMinor: 100, currency: "LKR" });
    expect(res.status).toBe(400);
  });
});

describe("base currency change", () => {
  it("blocks the change without a rate", async () => {
    const res = await request(app)
      .patch("/api/wedding")
      .set(header())
      .send({ currency: "LKR" });
    expect(res.status).toBe(400);
  });

  it("re-denominates every stored amount with the given rate", async () => {
    // An AED record created before the flip.
    await request(app)
      .post("/api/expenses")
      .set(header())
      .send({ name: "Cake", estimatedMinor: 50_000 });

    // AED → LKR at 80. LKR records stay as-is; AED records gain rate 80.
    const res = await request(app)
      .patch("/api/wedding")
      .set(header())
      .send({ currency: "LKR", rate: 80 });
    expect(res.status).toBe(200);
    expect(res.body.wedding.currency).toBe("LKR");
    expect(res.body.wedding.totalBudgetMinor).toBe(12_000_000 * 80);
    expect(res.body.wedding.rates).toEqual({ AED: 80 });

    const list = await request(app).get("/api/expenses").set(header());
    const lkr = list.body.expenses.find(
      (e: { name: string }) => e.name === "Flower arch",
    );
    expect(lkr.currency).toBe("LKR");
    expect(lkr.rate).toBe(1);
    expect(lkr.baseEstimatedMinor).toBe(100_000);

    const cake = list.body.expenses.find(
      (e: { name: string }) => e.name === "Cake",
    );
    expect(cake.currency).toBe("AED");
    expect(cake.rate).toBe(80);
    expect(cake.baseEstimatedMinor).toBe(50_000 * 80);
  });

  it("flipping back to AED uses the inverse rate bookkeeping", async () => {
    const res = await request(app)
      .patch("/api/wedding")
      .set(header())
      .send({ currency: "AED", rate: 0.0125 });
    expect(res.status).toBe(200);
    expect(res.body.wedding.currency).toBe("AED");
    expect(res.body.wedding.rates).toEqual({ LKR: 0.0125 });
  });
});

describe("category management", () => {
  it("rejects duplicate budget category names", async () => {
    const budget = await request(app).get("/api/budget").set(header());
    const existingName = budget.body.categories[0].name as string;
    const res = await request(app)
      .post("/api/budget/categories")
      .set(header())
      .send({ name: existingName.toUpperCase(), plannedMinor: 0 });
    expect(res.status).toBe(409);
  });

  it("adds, renames, and blocks deletion of an in-use budget category", async () => {
    const budget = await request(app).get("/api/budget").set(header());
    const inUseId = budget.body.categories[0].id as string;

    const created = await request(app)
      .post("/api/budget/categories")
      .set(header())
      .send({ name: "Gifts", plannedMinor: 50000 });
    expect(created.status).toBe(201);
    const giftId = created.body.category.id as string;

    const renamed = await request(app)
      .patch(`/api/budget/categories/${giftId}`)
      .set(header())
      .send({ name: "Gifts & favours" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.category.name).toBe("Gifts & favours");

    const blocked = await request(app)
      .delete(`/api/budget/categories/${inUseId}`)
      .set(header());
    expect(blocked.status).toBe(409);

    const deleted = await request(app)
      .delete(`/api/budget/categories/${giftId}`)
      .set(header());
    expect(deleted.status).toBe(204);
  });

  it("renames and deletes task categories with the same rules", async () => {
    const list = await request(app).get("/api/task-categories").set(header());
    const inUseId = list.body.categories.find(
      (c: { taskCount?: number }) => (c.taskCount ?? 0) > 0,
    )?.id as string;
    const unused = await request(app)
      .post("/api/task-categories")
      .set(header())
      .send({ name: "Registry" });
    expect(unused.status).toBe(201);
    const registryId = unused.body.category.id as string;

    const dup = await request(app)
      .post("/api/task-categories")
      .set(header())
      .send({ name: "registry" });
    expect(dup.status).toBe(409);

    const renamed = await request(app)
      .patch(`/api/task-categories/${registryId}`)
      .set(header())
      .send({ name: "Registry & gifts" });
    expect(renamed.status).toBe(200);

    const blocked = await request(app)
      .delete(`/api/task-categories/${inUseId}`)
      .set(header());
    expect(blocked.status).toBe(409);

    const deleted = await request(app)
      .delete(`/api/task-categories/${registryId}`)
      .set(header());
    expect(deleted.status).toBe(204);
  });
});
