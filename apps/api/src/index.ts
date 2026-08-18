import { createApp } from "./app.js";
import { connectDb } from "./db.js";
import { config } from "./config.js";

const RETRY_MS = 5_000;

async function connectWithRetry(): Promise<void> {
  for (;;) {
    try {
      await connectDb();
      console.log("[api] connected to MongoDB");
      return;
    } catch (err) {
      console.error(
        `[api] MongoDB connection failed (retrying in ${RETRY_MS / 1000}s):`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
}

async function main(): Promise<void> {
  const app = createApp();
  try {
    const mongoHost = new URL(config.mongoUri).hostname;
    console.log(`[api] config: port=${config.port} mongoHost=${mongoHost}`);
  } catch {
    console.log("[api] config: port=", config.port, "mongoUri=<unparseable>");
  }
  app.listen(config.port, () => {
    console.log(`[api] wedding-planner API listening on http://localhost:${config.port}`);
  });
  void connectWithRetry();
}

main().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
