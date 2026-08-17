import { describe, it, expect } from "vitest";
import { request, connectTestDb, disconnectTestDb } from "./helpers";
import { createApp } from "../../src/app";
import { version } from "../../../../package.json";

const app = createApp();

describe("GET /health", () => {
  it("returns 200 with the running version when Mongo is up", async () => {
    await connectTestDb();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      service: "wedding-planner-api",
      version,
      mongo: "up",
    });
  });

  it("returns 503 degraded when Mongo is down", async () => {
    await disconnectTestDb();
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: "degraded", mongo: "down" });
    await connectTestDb();
  });
});
