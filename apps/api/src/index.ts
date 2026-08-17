import { createApp } from "./app.js";
import { connectDb } from "./db.js";
import { config } from "./config.js";

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[api] wedding-planner API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
