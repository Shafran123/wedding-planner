/**
 * Polls ${RAILWAY_URL}/health until it reports status "ok" (5 min timeout).
 * Warns and exits 0 when RAILWAY_URL is unset so deploys aren't blocked
 * before the variable exists; set it with:
 *   gh variable set RAILWAY_URL --repo Shafran123/wedding-planner
 */
const base = process.env.RAILWAY_URL;
if (!base) {
  console.warn("RAILWAY_URL not set — skipping API health gate.");
  process.exit(0);
}

const deadline = Date.now() + 5 * 60_000;
let last = "";
while (Date.now() < deadline) {
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/health`);
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
