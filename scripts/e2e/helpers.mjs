import fs from "node:fs";
import path from "node:path";

const envFile = path.resolve(process.env.PWD, "apps/web/.env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim()];
    }),
);

export const API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;
export const API_URL = env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const WEB_URL = "http://localhost:3000";

export async function signUpFirebase(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`signUp failed: ${data?.error?.message ?? res.status}`);
  return data;
}

export async function signInFirebase(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`signIn failed: ${data?.error?.message ?? res.status}`);
  return data;
}

export async function onboardViaApi(idToken) {
  const res = await fetch(`${API_URL}/api/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      weddingName: "E2E Wedding",
      partnerOneName: "E2E",
      partnerTwoName: "Partner",
      weddingDate: "2027-12-24T12:00:00.000Z",
      currency: "AED",
      estimatedGuestCount: 180,
      totalBudgetMinor: 12_000_000,
      weddingType: "traditional",
      location: "Dubai",
      timezone: "Asia/Dubai",
    }),
  });
  if (res.status !== 201) {
    throw new Error(`onboard failed: ${res.status} ${await res.text()}`);
  }
}
