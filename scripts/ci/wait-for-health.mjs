/**
 * Polls ${RAILWAY_URL}/health until it reports status "ok" (5 min timeout).
 * Warns and exits 0 when RAILWAY_URL is unset so deploys aren't blocked
 * before the variable exists; set it with:
 *   gh variable set RAILWAY_URL --repo Shafran123/wedding-planner
 */
const raw = process.env.RAILWAY_URL;
if (!raw) {
  console.warn("RAILWAY_URL not set — skipping API health gate.");
  process.exit(0);
}

let base;
try {
  base = raw
    .trim()
    .replace(/^RAILWAY_URL=/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\/$/, "");
  new URL(base);
} catch {
  console.error(`RAILWAY_URL is not a valid URL (received "${raw.trim().slice(0, 80)}…"). ` +
    "Set it to just the bare https://… URL with no quotes.");
  process.exit(1);
}

const deadline = Date.now() + 5 * 60_000;
let last = "";
while (Date.now() < deadline) {
  try {
    const res = await fetch(`${base}/health`);
    const body = await res.json();
    last = JSON.stringify(body);
    if (res.ok && body.status === "ok") {
      console.log(`API healthy: ${last}`);
      process.exit(0);
    }
    console.log(`API not ready yet (${res.status}): ${last}`);
  } catch (err) {
    last = err instanceof Error ? err.message : String(err);
    console.log(`API unreachable: ${last}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

console.error(`API never became healthy within 5 minutes. Last state: ${last}`);
process.exit(1);
