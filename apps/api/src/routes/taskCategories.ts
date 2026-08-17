import { Router } from "express";
import { categoryNameSchema } from "@wedding/shared";
import type { TaskCategory as TaskCategoryDTO } from "@wedding/shared";
import { TaskCategory } from "../models/index.js";
import { ValidationError } from "../errors.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { iso, validate } from "./helpers.js";

function serializeCategory(doc: {
  _id: unknown;
  weddingId: unknown;
  createdAt: Date;
  name: string;
}): TaskCategoryDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name,
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
    const categories = await TaskCategory.find({ weddingId: authed.weddingId })
      .sort({ name: 1 })
      .lean();
    res.json({ categories: categories.map(serializeCategory) });
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
      throw new ValidationError("A category with this name already exists.");
    }

    const category = await TaskCategory.create({
      weddingId: authed.weddingId,
      name: input.name,
    });
    res.status(201).json({ category: serializeCategory(category.toObject()) });
  }),
);

export default router;
