import { Router } from "express";
import { categoryNameSchema } from "@wedding/shared";
import type { TaskCategory as TaskCategoryDTO } from "@wedding/shared";
import { Task, TaskCategory } from "../models/index.js";
import { ConflictError, NotFoundError } from "../errors.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { iso, validate } from "./helpers.js";

function serializeCategory(
  doc: {
    _id: unknown;
    weddingId: unknown;
    createdAt: Date;
    name: string;
  },
  taskCount?: number,
): TaskCategoryDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name,
    taskCount,
    createdAt: iso(doc.createdAt) as string,
  };
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const [categories, taskCounts] = await Promise.all([
      TaskCategory.find({ weddingId: authed.weddingId })
        .sort({ name: 1 })
        .lean(),
      Task.aggregate<{ _id: unknown; n: number }>([
        {
          $match: {
            weddingId: authed.weddingId,
            categoryId: { $ne: null },
          },
        },
        { $group: { _id: "$categoryId", n: { $sum: 1 } } },
      ]),
    ]);
    const countByCategory = new Map(
      taskCounts.map((c) => [String(c._id), c.n]),
    );
    res.json({
      categories: categories.map((c) =>
        serializeCategory(c, countByCategory.get(String(c._id)) ?? 0),
      ),
    });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(categoryNameSchema, req.body);

    const existing = await TaskCategory.findOne({
      weddingId: authed.weddingId,
      name: new RegExp(`^${input.name}$`, "i"),
    });
    if (existing) {
      throw new ConflictError("A category with this name already exists.");
    }

    const category = await TaskCategory.create({
      weddingId: authed.weddingId,
      name: input.name,
    });
    res.status(201).json({ category: serializeCategory(category.toObject()) });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(categoryNameSchema, req.body);

    const existing = await TaskCategory.findOne({
      weddingId: authed.weddingId,
      _id: { $ne: req.params.id },
      name: new RegExp(`^${input.name}$`, "i"),
    });
    if (existing) {
      throw new ConflictError("A category with this name already exists.");
    }

    const category = await TaskCategory.findOneAndUpdate(
      { _id: req.params.id, weddingId: authed.weddingId },
      { name: input.name },
      { new: true, lean: true },
    );
    if (!category) throw new NotFoundError("We couldn't find that category.");
    res.json({ category: serializeCategory(category) });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const inUse = await Task.countDocuments({
      weddingId: authed.weddingId,
      categoryId: req.params.id,
    });
    if (inUse > 0) {
      throw new ConflictError(
        "This category has tasks. Move or remove them before deleting it.",
      );
    }

    const category = await TaskCategory.findOneAndDelete({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!category) throw new NotFoundError("We couldn't find that category.");
    res.status(204).end();
  }),
);

export default router;
