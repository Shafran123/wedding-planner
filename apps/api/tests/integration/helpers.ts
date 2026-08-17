import mongoose from "mongoose";
import supertest from "supertest";

export const request = supertest;

export const TEST_DB = "mongodb://127.0.0.1:27017/wedding-planner-test";

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(TEST_DB);
}

export async function resetDb(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("DB not connected");
  }
  await mongoose.connection.dropDatabase();
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
}

export function authHeader(
  uid: string,
  email?: string,
  name?: string,
): Record<string, string> {
  const parts = ["test-token", uid];
  if (email) parts.push(email);
  if (name) parts.push(name);
  return { Authorization: `Bearer ${parts.join(":")}` };
}

export function onboardingBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    weddingName: "Sarah & Ahmed",
    partnerOneName: "Sarah",
    partnerTwoName: "Ahmed",
    weddingDate: "2026-12-24T16:00:00+04:00",
    currency: "AED",
    estimatedGuestCount: 180,
    totalBudgetMinor: 12_000_000,
    weddingType: "traditional",
    location: "Dubai",
    timezone: "Asia/Dubai",
    ...overrides,
  };
}