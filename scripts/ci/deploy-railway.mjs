/**
 * Deploys the API to Railway from CI (npx @railway/cli up) when the
 * RAILWAY_SERVICE_ID secret is set. Warns and continues otherwise —
 * useful while the service is still deployed manually/via the dashboard.
 */
import { spawnSync } from "node:child_process";

const service = process.env.RAILWAY_SERVICE_ID;
if (!service) {
  console.warn("RAILWAY_SERVICE_ID not set — skipping Railway deploy (manual/auto deploy assumed).");
  process.exit(0);
}

const token = (process.env.RAILWAY_TOKEN ?? "").trim();
console.log(`RAILWAY_TOKEN length=${token.length}`);
if (!token) {
  console.error("RAILWAY_TOKEN is empty.");
  process.exit(1);
}

const who = spawnSync("npx", ["--yes", "@railway/cli", "whoami"], {
  encoding: "utf8",
  env: { ...process.env, RAILWAY_TOKEN: token },
});
console.log("[whoami]", who.stdout?.trim() || who.stderr?.trim() || "(no output)");

const args = ["--yes", "@railway/cli", "up", "-d", "-c", "-s", service, "-e", "production"];
console.log(`[deploy] npx ${args.join(" ")}`);
const res = spawnSync("npx", args, {
  stdio: "inherit",
  env: { ...process.env, RAILWAY_TOKEN: token },
});
process.exit(res.status ?? 1);
