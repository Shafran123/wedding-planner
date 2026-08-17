import type { NextFunction, Request, Response } from "express";
import type { Role } from "@wedding/shared";
import { verifyIdToken } from "../firebaseAuth.js";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../errors.js";
import { Member, User } from "../models/index.js";

export interface AuthedRequest extends Request {
  uid: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
  };
  weddingId: string;
  role: Role;
}

async function syncUser(decoded: {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}): Promise<AuthedRequest["user"]> {
  const displayName = decoded.name || decoded.email || "Couple";
  const now = new Date();
  const user = await User.findOneAndUpdate(
    { _id: decoded.uid },
    {
      $set: {
        displayName,
        email: decoded.email ?? "",
        photoURL: decoded.picture,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, new: true, lean: true },
  );
  if (!user) throw new UnauthorizedError();
  return {
    id: String(user._id),
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL ?? undefined,
  };
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError();
    }
    const token = header.slice("Bearer ".length);
    let decoded: { uid: string; email?: string; name?: string; picture?: string };
    try {
      decoded = await verifyIdToken(token);
    } catch {
      throw new UnauthorizedError("Your session has expired. Please sign in again.");
    }
    const user = await syncUser(decoded);

    const authed = req as AuthedRequest;
    authed.uid = decoded.uid;
    authed.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireWedding(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authed = req as AuthedRequest;
    const member = await Member.findOne({ userId: authed.uid })
      .sort({ createdAt: 1 })
      .lean();
    if (!member) {
      throw new NotFoundError("You don't have a wedding yet. Complete onboarding first.");
    }
    authed.weddingId = String(member.weddingId);
    authed.role = member.role as Role;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authed = req as AuthedRequest;
    if (!roles.includes(authed.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}

/** Roles allowed to mutate normal planning data: everyone except viewers. */
export const WRITE_ROLES: Role[] = ["owner", "partner", "planner"];

/** Roles allowed to mutate financial data: owner and partner. */
export const FINANCIAL_ROLES: Role[] = ["owner", "partner"];
