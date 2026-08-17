import { Router } from "express";
import { onboardingSchema } from "@wedding/shared";
import {
  BudgetCategory,
  Member,
  Task,
  TaskCategory,
  Wedding,
} from "../models/index.js";
import { generateTemplateTasks } from "../domain/templates.js";
import {
  DEFAULT_BUDGET_CATEGORIES,
  DEFAULT_TASK_CATEGORIES,
} from "@wedding/shared";
import { ConflictError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, validate } from "./helpers.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(onboardingSchema, req.body);

    const existing = await Member.findOne({ userId: authed.uid }).lean();
    if (existing) {
      throw new ConflictError("You already have a wedding set up.");
    }

    const wedding = await Wedding.create({
      ownerId: authed.uid,
      weddingName: input.weddingName,
      partnerOneName: input.partnerOneName,
      partnerTwoName: input.partnerTwoName ?? "",
      weddingDate: new Date(input.weddingDate),
      timezone: input.timezone,
      currency: input.currency,
      estimatedGuestCount: input.estimatedGuestCount,
      totalBudgetMinor: input.totalBudgetMinor,
      weddingType: input.weddingType,
      location: input.location,
    });

    const weddingId = String(wedding._id);

    await Member.create({
      weddingId,
      userId: authed.uid,
      role: "owner",
      displayName: authed.user.displayName,
      email: authed.user.email,
    });

    await BudgetCategory.insertMany(
      DEFAULT_BUDGET_CATEGORIES.map((name) => ({ weddingId, name, plannedMinor: 0 })),
    );
    await TaskCategory.insertMany(
      DEFAULT_TASK_CATEGORIES.map((name) => ({ weddingId, name })),
    );

    const categories = await TaskCategory.find({ weddingId }).lean();
    const categoryIdByName = new Map(categories.map((c) => [c.name, String(c._id)]));

    const generated = generateTemplateTasks(wedding.weddingDate.toISOString());
    await Task.insertMany(
      generated.map((task) => ({
        weddingId,
        title: task.title,
        categoryId: categoryIdByName.get(task.category) ?? null,
        status: task.status,
        priority: task.priority,
        dueDate: new Date(task.dueDate),
      })),
    );

    await writeActivity({
      weddingId,
      actor: actorOf(authed),
      type: "wedding_updated",
      entityType: "wedding",
      entityId: weddingId,
      message: `${authed.user.displayName} created the wedding "${input.weddingName}"`,
    });

    res.status(201).json({ weddingId });
  }),
);

export default router;
