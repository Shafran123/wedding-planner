import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { version } from "../../../package.json";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error.js";

const PRIVATE_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

function isAllowedOrigin(origin: string): boolean {
  if (config.corsOrigin === "*") return true;
  if (config.corsOrigin.split(",").includes(origin)) return true;
  // Local development from other devices on the same network (e.g. phone testing).
  if (process.env.NODE_ENV !== "production" && PRIVATE_ORIGIN.test(origin)) return true;
  return false;
}
import onboardingRouter from "./routes/onboarding.js";
import meRouter from "./routes/me.js";
import weddingRouter from "./routes/wedding.js";
import membersRouter from "./routes/members.js";
import memberManagementRouter from "./routes/memberManagement.js";
import invitationsRouter from "./routes/invitations.js";
import tasksRouter from "./routes/tasks.js";
import taskCategoriesRouter from "./routes/taskCategories.js";
import budgetRouter from "./routes/budget.js";
import expensesRouter from "./routes/expenses.js";
import paymentsRouter from "./routes/payments.js";
import vendorsRouter from "./routes/vendors.js";
import locationsRouter from "./routes/locations.js";
import eventsRouter from "./routes/events.js";
import notesRouter from "./routes/notes.js";
import attachmentsRouter from "./routes/attachments.js";
import notificationsRouter from "./routes/notifications.js";
import activityRouter from "./routes/activity.js";
import dashboardRouter from "./routes/dashboard.js";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    const mongoUp = mongoose.connection.readyState === 1;
    const firebaseConfigured = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    );
    res.status(mongoUp ? 200 : 503).json({
      status: mongoUp ? "ok" : "degraded",
      service: "wedding-planner-api",
      version,
      sha: process.env.APP_SHA ?? "unknown",
      mongo: mongoUp ? "up" : "down",
      firebase: firebaseConfigured ? "configured" : "missing",
    });
  });

  app.use("/api/me", meRouter);
  app.use("/api/onboarding", onboardingRouter);
  app.use("/api/wedding", weddingRouter);
  app.use("/api/wedding/members", memberManagementRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/invitations", invitationsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/task-categories", taskCategoriesRouter);
  app.use("/api/budget", budgetRouter);
  app.use("/api/expenses", expensesRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/vendors", vendorsRouter);
  app.use("/api/locations", locationsRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/notes", notesRouter);
  app.use("/api/attachments", attachmentsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/activity", activityRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "Not found." } });
  });

  app.use(errorHandler);

  return app;
}
