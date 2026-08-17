import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createApp } from "../../src/app.js";
import { Member, Task } from "../../src/models/index.js";
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
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

async function setup(): Promise<{
  weddingAId: string;
  weddingBId: string;
  taskAId: string;
}> {
  const a = await request(app)
    .post("/api/onboarding")
    .set(authHeader("a", "owner@test.com", "Owner A"))
    .send(onboardingBody());
  const b = await request(app)
    .post("/api/onboarding")
    .set(authHeader("b", "ownerb@test.com", "Owner B"))
    .send(onboardingBody({ weddingName: "B & B" }));

  const task = await request(app)
    .post("/api/tasks")
    .set(authHeader("a", "owner@test.com", "Owner A"))
    .send({ title: "A's private task", priority: "high", dueDate: "2026-09-01" });

  return {
    weddingAId: a.body.weddingId as string,
    weddingBId: b.body.weddingId as string,
    taskAId: task.body.task.id as string,
  };
}

describe("permissions", () => {
  it("user B cannot see user A's wedding data", async () => {
    const { taskAId } = await setup();

    const res = await request(app)
      .get("/api/tasks")
      .set(authHeader("b", "ownerb@test.com", "Owner B"));
    expect(res.status).toBe(200);
    expect(res.body.tasks.find((t: { id: string }) => t.id === taskAId)).toBeUndefined();

    const direct = await request(app)
      .get(`/api/tasks/${taskAId}`)
      .set(authHeader("b", "ownerb@test.com", "Owner B"));
    expect(direct.status).toBe(404);
  });

  it("viewer can read but cannot write", async () => {
    const { weddingAId } = await setup();

    const invite = await request(app)
      .post("/api/invitations")
      .set(authHeader("a", "owner@test.com", "Owner A"))
      .send({ email: "viewer@test.com", role: "viewer" });
    expect(invite.status).toBe(201);
    const token = invite.body.invitation.token as string;

    const view = await request(app)
      .get(`/api/invitations/${token}`)
      .set(authHeader("v", "viewer@test.com", "Viewer"));
    expect(view.status).toBe(200);
    expect(view.body.role).toBe("viewer");

    const accept = await request(app)
      .post(`/api/invitations/${token}/accept`)
      .set(authHeader("v", "viewer@test.com", "Viewer"));
    expect(accept.status).toBe(200);

    const member = await Member.findOne({ weddingId: weddingAId, userId: "v" }).lean();
    expect(member?.role).toBe("viewer");

    const read = await request(app)
      .get("/api/tasks")
      .set(authHeader("v", "viewer@test.com", "Viewer"));
    expect(read.status).toBe(200);

    const write = await request(app)
      .post("/api/tasks")
      .set(authHeader("v", "viewer@test.com", "Viewer"))
      .send({ title: "Should fail" });
    expect(write.status).toBe(403);

    const manage = await request(app)
      .patch("/api/wedding")
      .set(authHeader("v", "viewer@test.com", "Viewer"))
      .send({ weddingName: "Hacked" });
    expect(manage.status).toBe(403);
  });

  it("planner can manage tasks, vendors and events but not finances", async () => {
    await setup();

    const invite = await request(app)
      .post("/api/invitations")
      .set(authHeader("a", "owner@test.com", "Owner A"))
      .send({ email: "planner@test.com", role: "planner" });
    const token = invite.body.invitation.token as string;

    await request(app)
      .post(`/api/invitations/${token}/accept`)
      .set(authHeader("p", "planner@test.com", "Planner"));

    const task = await request(app)
      .post("/api/tasks")
      .set(authHeader("p", "planner@test.com", "Planner"))
      .send({ title: "Planner task" });
    expect(task.status).toBe(201);

    const vendor = await request(app)
      .post("/api/vendors")
      .set(authHeader("p", "planner@test.com", "Planner"))
      .send({ name: "Planner vendor", category: "Catering" });
    expect(vendor.status).toBe(201);

    const expense = await request(app)
      .post("/api/expenses")
      .set(authHeader("p", "planner@test.com", "Planner"))
      .send({ name: "Not allowed", estimatedMinor: 100 });
    expect(expense.status).toBe(403);

    const payment = await request(app)
      .post("/api/payments")
      .set(authHeader("p", "planner@test.com", "Planner"))
      .send({ amountMinor: 100, dueDate: "2026-10-01" });
    expect(payment.status).toBe(403);
  });

  it("invitation email must match the accepting user", async () => {
    await setup();

    const invite = await request(app)
      .post("/api/invitations")
      .set(authHeader("a", "owner@test.com", "Owner A"))
      .send({ email: "someone@test.com", role: "partner" });
    const token = invite.body.invitation.token as string;

    const accept = await request(app)
      .post(`/api/invitations/${token}/accept`)
      .set(authHeader("x", "other@test.com", "Other"));
    expect(accept.status).toBe(403);
  });

  it("owner can change a member's role", async () => {
    const { weddingAId } = await setup();

    const invite = await request(app)
      .post("/api/invitations")
      .set(authHeader("a", "owner@test.com", "Owner A"))
      .send({ email: "partner@test.com", role: "viewer" });
    const token = invite.body.invitation.token as string;

    await request(app)
      .post(`/api/invitations/${token}/accept`)
      .set(authHeader("pa", "partner@test.com", "Partner"));

    const member = await Member.findOne({ weddingId: weddingAId, userId: "pa" }).lean();
    expect(member).toBeTruthy();

    const change = await request(app)
      .patch(`/api/wedding/members/${String(member!._id)}`)
      .set(authHeader("a", "owner@test.com", "Owner A"))
      .send({ role: "partner" });
    expect(change.status).toBe(200);

    const updated = await Member.findById(member!._id).lean();
    expect(updated?.role).toBe("partner");
  });

  it("a member who is not owner cannot change roles", async () => {
    const { weddingAId } = await setup();

    const invite = await request(app)
      .post("/api/invitations")
      .set(authHeader("a", "owner@test.com", "Owner A"))
      .send({ email: "planner2@test.com", role: "planner" });
    const token = invite.body.invitation.token as string;
    await request(app)
      .post(`/api/invitations/${token}/accept`)
      .set(authHeader("p2", "planner2@test.com", "Planner 2"));

    const target = await Member.findOne({ weddingId: weddingAId, userId: "a" }).lean();

    const attempt = await request(app)
      .patch(`/api/wedding/members/${String(target!._id)}`)
      .set(authHeader("p2", "planner2@test.com", "Planner 2"))
      .send({ role: "viewer" });
    expect(attempt.status).toBe(403);

    const tasks = await Task.countDocuments({ weddingId: weddingAId });
    expect(tasks).toBeGreaterThan(0);
  });
});

describe("invitation decline", () => {
  it("declining marks the invitation declined and blocks acceptance", async () => {
    await setup();

    const invite = await request(app)
      .post("/api/invitations")
      .set(authHeader("a", "owner@test.com", "Owner A"))
      .send({ email: "decliner@test.com", role: "viewer" });
    const token = invite.body.invitation.token as string;

    const decline = await request(app)
      .post(`/api/invitations/${token}/decline`)
      .set(authHeader("d", "decliner@test.com", "Decliner"));
    expect(decline.status).toBe(200);

    const accept = await request(app)
      .post(`/api/invitations/${token}/accept`)
      .set(authHeader("d", "decliner@test.com", "Decliner"));
    expect(accept.status).toBe(400);
  });
});
