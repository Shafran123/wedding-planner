import "dotenv/config";

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: readInt("PORT", 4000),
  mongoUri:
    process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/wedding-planner",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  isTest: process.env.NODE_ENV === "test",
};
