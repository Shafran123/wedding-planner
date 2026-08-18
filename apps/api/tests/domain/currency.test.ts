import { describe, it, expect } from "vitest";
import {
  normalizeMoney,
  ratesToObject,
  weddingRateFor,
} from "../../src/domain/currency.js";
import { ValidationError } from "../../src/errors.js";

describe("normalizeMoney", () => {
  it("returns null for missing amounts", () => {
    expect(normalizeMoney({ minor: null }, "AED")).toBeNull();
    expect(normalizeMoney({ minor: undefined }, "AED")).toBeNull();
  });

  it("treats base-currency amounts as rate 1", () => {
    expect(
      normalizeMoney({ minor: 1_000, currency: "AED", rate: 5 }, "AED"),
    ).toEqual({ currency: "AED", rate: 1, baseMinor: 1_000 });
    expect(normalizeMoney({ minor: 1_000 }, "AED")).toEqual({
      currency: "AED",
      rate: 1,
      baseMinor: 1_000,
    });
  });

  it("converts foreign amounts with rounding", () => {
    expect(
      normalizeMoney({ minor: 100_000, currency: "LKR", rate: 0.0122 }, "AED"),
    ).toEqual({ currency: "LKR", rate: 0.0122, baseMinor: 1_220 });
    expect(
      normalizeMoney({ minor: 333, currency: "LKR", rate: 0.4 }, "AED")
        ?.baseMinor,
    ).toBe(133);
  });

  it("falls back to the wedding's stored rate", () => {
    expect(
      normalizeMoney({ minor: 100, currency: "LKR" }, "AED", 0.5),
    ).toEqual({ currency: "LKR", rate: 0.5, baseMinor: 50 });
  });

  it("rejects foreign amounts without any rate", () => {
    expect(() =>
      normalizeMoney({ minor: 100, currency: "LKR" }, "AED"),
    ).toThrow(ValidationError);
  });
});

describe("rate helpers", () => {
  it("reads Map and object rate sources", () => {
    expect(weddingRateFor(new Map([["LKR", 0.5]]), "LKR")).toBe(0.5);
    expect(weddingRateFor({ LKR: 0.5 }, "LKR")).toBe(0.5);
    expect(weddingRateFor(null, "LKR")).toBeUndefined();
  });

  it("serializes Map and object sources to a plain object", () => {
    expect(ratesToObject(new Map([["AED", 80]]))).toEqual({ AED: 80 });
    expect(ratesToObject({ AED: 80 })).toEqual({ AED: 80 });
    expect(ratesToObject(undefined)).toEqual({});
  });
});
