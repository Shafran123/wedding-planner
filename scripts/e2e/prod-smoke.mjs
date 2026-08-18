/**
 * Production smoke test. Requires a live prod deploy:
 *   PROD_URL=<https://xxx.vercel.app> PROD_API_URL=<https://xxx.up.railway.app> \
 *     node scripts/e2e/prod-smoke.mjs
 *
 * Flow: signup → login → onboarding → dashboard → assert version badge +
 * Settings About version → /health check → logout → login.
 * Cleanup of the throwaway user: scripts/ci/cleanup-prod-users.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { signUpFirebase } from "./helpers.mjs";

const WEB_URL = process.env.PROD_URL;
const API_BASE = process.env.PROD_API_URL;
if (!WEB_URL || !API_BASE) {
  console.error("Set PROD_URL and PROD_API_URL.");
  process.exit(1);
}

const rootPkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
const email = `e2e-smoke-${Date.now()}@test.weddingplanner.local`;
const password = "e2epass123!";
const expectedFooter = `v${rootPkg.version} · Beta`;
const aboutRe = new RegExp(`v${rootPkg.version}\\+([0-9a-f]{7}|dev)`);

const browser = await chromium.launch();
const page = await browser.newPage();
let failed = false;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "GREEN" : "RED"}: ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed = true;
};

try {
  await signUpFirebase(email, password);

  await page.goto(`${WEB_URL}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 30_000 });

  await page.fill("#weddingName", "Smoke Wedding");
  await page.fill("#partnerOneName", "Smoke");
  await page.fill("#partnerTwoName", "Test");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.fill("#weddingDate", "2027-12-24");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.fill("#estimatedGuestCount", "180");
  await page.fill("#totalBudget", "120000");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Create my wedding" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  check("onboarding → dashboard", true, page.url());

  const footerText = await page.locator("aside").innerText();
  check("sidebar shows version", footerText.toUpperCase().includes(expectedFooter.toUpperCase()), footerText.trim().split("\n").pop());

  await page.goto(`${WEB_URL}/settings`);
  await page.getByRole("tab", { name: "About" }).click();
  const aboutText = await page.locator("main").innerText();
  check("Settings About shows version+sha", aboutRe.test(aboutText), (aboutText.match(aboutRe) ?? [])[0]);

  const health = await fetch(`${API_BASE.replace(/\/$/, "")}/health`).then((r) => r.json()).catch((e) => ({ error: e.message }));
  check("/health ok", health.status === "ok", JSON.stringify(health));
  const apiVersionOk = /^\d+\.\d+\.\d+$/.test(health.version ?? "");
  check("/health version is semver", apiVersionOk, `api=${health.version}`);
  if (apiVersionOk && health.version !== rootPkg.version) {
    console.log(`NOTE: API runs ${health.version} (pkg ${rootPkg.version}) — Railway deploy may lag the release.`);
  }

  await page.getByRole("button", { name: "Profile menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL("**/login", { timeout: 15_000 });
  check("logout → /login", true);

  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  check("login again → dashboard", true);
} catch (err) {
  check("smoke run completed without error", false, err instanceof Error ? err.message : String(err));
} finally {
  await browser.close();
}

if (failed) {
  console.error("SMOKE FAILED");
  process.exit(1);
}
console.log("SMOKE PASSED");
