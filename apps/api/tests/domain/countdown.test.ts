import { describe, it, expect } from "vitest";
import { getCountdown } from "../../src/domain/countdown.js";

describe("getCountdown", () => {
  it("computes days, hours and minutes from a fixed now", () => {
    // Wedding 24 Dec 2026, 16:00 Dubai time. Now: 21 Aug 2026 10:00 Dubai.
    const result = getCountdown({
      weddingDate: "2026-12-24T16:00:00+04:00",
      timezone: "Asia/Dubai",
      now: new Date("2026-08-21T06:00:00Z"),
    });
    expect(result.passed).toBe(false);
    expect(result.days).toBe(125);
    expect(result.hours).toBe(6);
    expect(result.minutes).toBe(0);
  });

  it("marks the countdown as passed after the wedding date", () => {
    const result = getCountdown({
      weddingDate: "2026-12-24T16:00:00+04:00",
      timezone: "Asia/Dubai",
      now: new Date("2026-12-25T06:00:00Z"),
    });
    expect(result.passed).toBe(true);
    expect(result.days).toBe(0);
  });

  it("uses the wedding timezone, not the user's", () => {
    // Same instant viewed from a user 11 hours behind Dubai.
    const result = getCountdown({
      weddingDate: "2026-12-24T16:00:00+04:00",
      timezone: "Asia/Dubai",
      now: new Date("2026-12-23T04:00:00Z"),
    });
    // In Dubai it is 08:00 on the 23rd — the wedding is tomorrow, not "in 36 hours from UTC view".
    expect(result.days).toBe(1);
  });

  it("produces a human label", () => {
    const result = getCountdown({
      weddingDate: "2026-12-24T16:00:00+04:00",
      timezone: "Asia/Dubai",
      now: new Date("2026-08-21T06:00:00Z"),
    });
    expect(result.label).toBe("125 days");
  });
});
