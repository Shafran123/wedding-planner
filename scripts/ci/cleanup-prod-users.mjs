/**
 * Deletes throwaway e2e users (Firebase) and their weddings (Mongo) from prod.
 * Run with prod credentials:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='<json>' MONGODB_URI='<atlas uri>' \
 *     node --import tsx scripts/ci/cleanup-prod-users.mjs
 */
import admin from "firebase-admin";
import mongoose from "mongoose";

const { FIREBASE_SERVICE_ACCOUNT_JSON, MONGODB_URI, EMAIL_PATTERN = "^e2e-" } = process.env;
if (!FIREBASE_SERVICE_ACCOUNT_JSON || !MONGODB_URI) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_JSON and MONGODB_URI.");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)) });
const re = new RegExp(EMAIL_PATTERN);
const list = await admin.auth().listUsers();
const users = list.users.filter((u) => re.test(u.email ?? ""));
if (users.length) {
  await admin.auth().deleteUsers(users.map((u) => u.uid));
  console.log("deleted", users.length, "firebase users matching", EMAIL_PATTERN);
} else {
  console.log("no firebase users matching", EMAIL_PATTERN);
}

await mongoose.connect(MONGODB_URI);
const { Wedding, Task, BudgetCategory, TaskCategory, Expense, Payment, Notification, Activity, Member, User } = await import("../apps/api/src/models/index.js");
const weddings = await Wedding.find({ weddingName: { $in: ["Smoke Wedding", "Journey Wedding", "E2E Wedding", "E2E Onboarding"] } }).lean();
for (const w of weddings) {
  await Promise.all([
    Task.deleteMany({ weddingId: w._id }),
    BudgetCategory.deleteMany({ weddingId: w._id }),
    TaskCategory.deleteMany({ weddingId: w._id }),
    Expense.deleteMany({ weddingId: w._id }),
    Payment.deleteMany({ weddingId: w._id }),
    Notification.deleteMany({ weddingId: w._id }),
    Activity.deleteMany({ weddingId: w._id }),
    Member.deleteMany({ weddingId: w._id }),
  ]);
  await Wedding.deleteOne({ _id: w._id });
  console.log("removed wedding", String(w._id));
}
await User.deleteMany({ email: { $regex: EMAIL_PATTERN } });
await mongoose.disconnect();
console.log("cleanup complete");
