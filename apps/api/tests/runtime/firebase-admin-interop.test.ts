/**
 * Runtime interop tests — executed with tsx (the production runtime), because
 * vitest/vite resolve CJS→ESM interop differently than tsx/esbuild.
 *
 * Regression for: firebase-admin namespace import exposing `credential` as
 * undefined under tsx, which made every token verification throw and every
 * authenticated request return 401 "session expired".
 */
import { test } from "node:test";
import assert from "node:assert/strict";

test("firebase-admin exposes credential.cert and initializeApp under the API runtime", async () => {
  const module = await import("../../src/firebaseAuth.js");
  const admin = await import("firebase-admin");

  assert.equal(typeof admin.credential, "object", "admin.credential must be an object");
  assert.equal(
    typeof admin.credential?.cert,
    "function",
    "admin.credential.cert must be a function (tsx CJS interop regression)",
  );
  assert.equal(typeof admin.initializeApp, "function");
  assert.equal(typeof module.verifyIdToken, "function");
});
