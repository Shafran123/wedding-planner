import { Router } from "express";
import { taskSchema, taskUpdateSchema } from "@wedding/shared";
import type { Task as TaskDTO } from "@wedding/shared";
import { Member, Task, TaskCategory } from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, cleanString, iso, validate } from "./helpers.js";

function serializeTask(
  doc: Record<string, unknown>,
  categoryNames: Map<string, string>,
  memberNames: Map<string, string>,
): TaskDTO {
  const categoryId = doc.categoryId ? String(doc.categoryId) : undefined;
  const assignedTo = doc.assignedTo ? String(doc.assignedTo) : undefined;
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    title: doc.title as string,
    description: (doc.description as string) || undefined,
    categoryId,
    categoryName: categoryId ? categoryNames.get(categoryId) : undefined,
    status: doc.status as TaskDTO["status"],
    priority: doc.priority as TaskDTO["priority"],
    dueDate: iso(doc.dueDate as Date | null),
    assignedTo,
    assigneeName: assignedTo ? memberNames.get(assignedTo) : undefined,
    estimatedCostMinor: (doc.estimatedCostMinor as number | null) ?? undefined,
    actualCostMinor: (doc.actualCostMinor as number | null) ?? undefined,
    vendorId: doc.vendorId ? String(doc.vendorId) : undefined,
    eventId: doc.eventId ? String(doc.eventId) : undefined,
    createdAt: iso(doc.createdAt as Date) as string,
    updatedAt: iso(doc.updatedAt as Date) as string,
    completedAt: iso(doc.completedAt as Date | null),
  };
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const filter: Record<string, unknown> = { weddingId: authed.weddingId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.q) {
      filter.title = { $regex: String(req.query.q), $options: "i" };
    }

    const [tasks, categories, members] = await Promise.all([
      Task.find(filter).limit(500).lean(),
      TaskCategory.find({ weddingId: authed.weddingId }).lean(),
      Member.find({ weddingId: authed.weddingId }).lean(),
    ]);

    const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));
    const memberNames = new Map(members.map((m) => [m.userId, m.displayName]));

    const sorted = tasks
      .map((t) => serializeTask(t as unknown as Record<string, unknown>, categoryNames, memberNames))
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      });

    res.json({ tasks: sorted });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(taskSchema, req.body);

    const task = await Task.create({
      weddingId: authed.weddingId,
      title: input.title,
      description: input.description ?? "",
      categoryId: cleanString(input.categoryId) ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assignedTo: cleanString(input.assignedTo) ?? null,
      estimatedCostMinor: input.estimatedCostMinor ?? null,
      actualCostMinor: input.actualCostMinor ?? null,
      vendorId: cleanString(input.vendorId) ?? null,
      eventId: cleanString(input.eventId) ?? null,
      completedAt: input.status === "completed" ? new Date() : null,
    });

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "task_created",
      entityType: "task",
      entityId: String(task._id),
      message: `${authed.user.displayName} added the task "${input.title}"`,
    });

    res.status(201).json({ task: { id: String(task._id) } });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const task = await Task.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!task) throw new NotFoundError("We couldn't find that task.");

    const [categories, members] = await Promise.all([
      TaskCategory.find({ weddingId: authed.weddingId }).lean(),
      Member.find({ weddingId: authed.weddingId }).lean(),
    ]);
    const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));
    const memberNames = new Map(members.map((m) => [m.userId, m.displayName]));

    res.json({
      task: serializeTask(task as unknown as Record<string, unknown>, categoryNames, memberNames),
    });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(taskUpdateSchema, req.body);

    const task = await Task.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!task) throw new NotFoundError("We couldn't find that task.");

    const previousStatus = task.status;
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "dueDate") {
        task.set("dueDate", value ? new Date(value as string) : null);
      } else if (key === "categoryId" || key === "vendorId" || key === "eventId" || key === "assignedTo") {
        task.set(key, cleanString(value as string) ?? null);
      } else if (key === "status") {
        task.set("status", value);
        if (value === "completed") {
          task.set("completedAt", new Date());
        } else if (previousStatus === "completed") {
          task.set("completedAt", null);
        }
      } else {
        task.set(key, value);
      }
    }
    await task.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: task.status === "completed" ? "task_completed" : "task_updated",
      entityType: "task",
      entityId: String(task._id),
      message:
        task.status === "completed"
          ? `${authed.user.displayName} completed "${task.title}"`
          : `${authed.user.displayName} updated "${task.title}"`,
    });

    res.json({ task: { id: String(task._id) } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!task) throw new NotFoundError("We couldn't find that task.");

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "task_deleted",
      entityType: "task",
      message: `${authed.user.displayName} deleted the task "${task.title}"`,
    });

    res.status(204).end();
  }),
);

export default router;
