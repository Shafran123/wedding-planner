/**
 * E2E loop: completing onboarding must land on the dashboard.
 * Regression for: "after filling the startup questions, nothing happens".
 */
import { chromium } from "playwright";
import { signUpFirebase, WEB_URL } from "./helpers.mjs";

const email = `e2e-onboard-${Date.now()}@test.weddingplanner.local`;
const password = "e2epass123!";

const browser = await chromium.launch();
const page = await browser.newPage();
const failedApi = [];
page.on("response", (res) => {
  if (res.url().includes("/api/") && res.status() >= 400) {
    failedApi.push(`${res.status()} ${res.url().split("/api/")[1]} ${res.statusText()}`);
  }
});

try {
  await signUpFirebase(email, password);

  await page.goto(`${WEB_URL}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 20_000 });
  console.log("on onboarding:", page.url());

  await page.fill("#weddingName", "E2E Onboarding");
  await page.fill("#partnerOneName", "Test");
  await page.fill("#partnerTwoName", "Partner");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.fill("#weddingDate", "2027-12-24");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.fill("#estimatedGuestCount", "180");
  await page.fill("#totalBudget", "120000");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: "Create my wedding" }).click();

  try {
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    console.log("GREEN: landed on dashboard");
    const heading = await page.locator("h1").first().textContent().catch(() => "");
    console.log("heading:", heading?.slice(0, 60));
  } catch {
    console.log("RED: still stuck on:", page.url());
    for (const f of failedApi) console.log("failed api call:", f);
    const visibleError = await page
      .locator('[role="alert"], .text-red-700')
      .allTextContents()
      .catch(() => []);
    console.log("visible errors:", visibleError);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
