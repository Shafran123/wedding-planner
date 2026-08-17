/**
 * E2E loop: hard browser reload must NOT log the user out.
 * Regression for: reload → redirect to /login ("user gets logged out").
 */
import { chromium } from "playwright";
import { signUpFirebase, onboardViaApi, WEB_URL } from "./helpers.mjs";

const email = `e2e-reload-${Date.now()}@test.weddingplanner.local`;
const password = "e2epass123!";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.text().includes("[DEBUG-a1]")) console.log("PAGE:", msg.text());
});
const apiStatus = [];
page.on("response", (res) => {
  if (res.url().includes("/api/")) apiStatus.push(`${res.status()} ${res.url().split("/api/")[1]}`);
});

try {
  const signup = await signUpFirebase(email, password);
  await onboardViaApi(signup.idToken);

  await page.goto(`${WEB_URL}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  console.log("signed in, at:", page.url());

  await page.reload();
  await page.waitForTimeout(6_000);

  const url = page.url();
  const greeting = await page.locator("h1").first().textContent().catch(() => "");

  if (url.includes("/login")) {
    console.log("RED: after reload the user landed on /login — logged out reproduced");
    process.exitCode = 1;
  } else if (!url.includes("/dashboard")) {
    console.log(`RED: after reload the user is at ${url}`);
    process.exitCode = 1;
  } else {
    console.log("GREEN: stayed logged in after reload");
    console.log("greeting:", greeting?.slice(0, 60));
  }
  for (const e of errors) console.log(e);
  console.log("api calls after reload:", JSON.stringify(apiStatus));
} finally {
  await browser.close();
}
