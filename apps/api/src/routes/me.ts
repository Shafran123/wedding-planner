import { Router } from "express";
import type { User as UserDTO } from "@wedding/shared";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { Member } from "../models/index.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const member = await Member.findOne({ userId: authed.uid })
      .sort({ createdAt: 1 })
      .lean();
    const user: UserDTO = {
      id: authed.user.id,
      displayName: authed.user.displayName,
      email: authed.user.email,
      photoURL: authed.user.photoURL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    res.json({ user, hasWedding: Boolean(member), weddingId: member ? String(member.weddingId) : undefined });
  }),
);

export default router;
