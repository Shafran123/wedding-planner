import { Router } from "express";
import type { Member as MemberDTO } from "@wedding/shared";
import { Member } from "../models/index.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireWedding } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { iso } from "./helpers.js";

function serializeMember(doc: {
  _id: unknown;
  weddingId: unknown;
  createdAt: Date;
  [key: string]: unknown;
}): MemberDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    userId: doc.userId as string,
    role: doc.role as MemberDTO["role"],
    displayName: doc.displayName as string,
    email: doc.email as string,
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
    const members = await Member.find({ weddingId: authed.weddingId })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ members: members.map(serializeMember) });
  }),
);

export default router;
