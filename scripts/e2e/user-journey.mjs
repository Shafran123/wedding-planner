/**
 * E2E loop matching the user's reported journey:
 * onboarding → hard reload → (logged out?) → sign in again → fill wizard → submit.
 * Regression for: "after hard reload the user gets logged out, and after
 * filling the startup questions nothing happens".
 */
import { chromium } from "playwright";
import { signUpFirebase, WEB_URL } from "./helpers.mjs";

const email = `e2e-journey-${Date.now()}@test.weddingplanner.local`;
const password = "e2epass123!";

const browser = await chromium.launch();
const page = await browser.newPage();
const events = [];
page.on("console", (msg) => {
  const t = msg.text();
  if (t.includes("[DEBUG-") || t.includes("error")) events.push(`console: ${t.slice(0, 140)}`);
});
page.on("pageerror", (e) => events.push(`pageerror: ${e.message}`));
page.on("response", (res) => {
  if (res.url().includes("/api/")) {
    events.push(`api: ${res.status()} ${res.url().split("/api/")[1]}`);
  }
});

async function fillWizard() {
  await page.fill("#weddingName", "Journey Wedding");
  await page.fill("#partnerOneName", "Test");
  await page.fill("#partnerTwoName", "Partner");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.fill("#weddingDate", "2027-12-24");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.fill("#estimatedGuestCount", "180");
  await page.fill("#totalBudget", "120000");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Create my wedding" }).click();
}

try {
  await signUpFirebase(email, password);

  await page.goto(`${WEB_URL}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 20_000 });
  console.log("step 1: on onboarding");

  await page.reload();
  await page.waitForTimeout(5_000);
  console.log("step 2: after hard reload →", page.url());

  if (!page.url().includes("/login")) {
    console.log("NOTE: user was NOT logged out on reload this run");
  } else {
    console.log("RED-A: user was logged out after hard reload");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/onboarding", { timeout: 20_000 });
    console.log("step 3: re-signed-in, back on onboarding");
  }

  await fillWizard();
  await page.waitForTimeout(6_000);
  const final = page.url();
  console.log("step 4: after submit →", final);
  if (final.includes("/onboarding")) {
    console.log("RED-B: stuck on onboarding after filling the questions");
    process.exitCode = 1;
  } else if (final.includes("/dashboard")) {
    console.log("GREEN-B: reached dashboard");
  } else {
    console.log("RED-?: unexpected final url");
    process.exitCode = 1;
  }
} finally {
  console.log("=== event log ===");
  for (const e of events) console.log(e);
  await browser.close();
}
