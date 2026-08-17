import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../../src/app.js";
import { User } from "../../src/models/index.js";
import {
  authHeader,
  connectTestDb,
  disconnectTestDb,
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

describe("auth middleware", () => {
  it("accepts a valid token and syncs the user", async () => {
    const res = await request(app)
      .get("/api/me")
      .set(authHeader("u1", "sarah@test.com", "Sarah"));

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe("u1");
    expect(res.body.user.displayName).toBe("Sarah");
    expect(res.body.hasWedding).toBe(false);

    const stored = await User.findById("u1").lean();
    expect(stored?.email).toBe("sarah@test.com");
  });

  it("rejects a missing token", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  it("rejects an invalid token", async () => {
    const res = await request(app)
      .get("/api/me")
      .set(authHeader("u1", "bad@test.com"))
      .set("Authorization", "Bearer not-a-test-token");
    expect(res.status).toBe(401);
  });
});
