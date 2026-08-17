// Default import: under tsx (the API runtime), CJS modules surface their API
// on the default export — namespace imports only expose { default } there.
import admin from "firebase-admin";
import { AppError } from "./errors.js";

let app: admin.app.App | null = null;

function getApp(): admin.app.App {
  if (app) return app;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountPath) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
  } else if (serviceAccountJson) {
    app = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });
  } else if (process.env.NODE_ENV === "test") {
    app = admin.initializeApp({ projectId: "wedding-planner-test" });
  } else {
    throw new AppError(
      500,
      "firebase_unconfigured",
      "Firebase is not configured on the server. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.",
    );
  }

  return app;
}

export interface VerifiedToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

export async function verifyIdToken(token: string): Promise<VerifiedToken> {
  const decoded = await getApp().auth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  };
}
