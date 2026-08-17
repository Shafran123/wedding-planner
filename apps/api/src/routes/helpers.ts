import type { ZodType } from "zod";
import { ValidationError } from "../errors.js";
import type { AuthedRequest } from "../middleware/auth.js";

export function validate<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues[0]?.message ?? "Please check your input.",
    );
  }
  return result.data;
}

export function iso(date: Date | null | undefined): string | undefined {
  return date ? date.toISOString() : undefined;
}

export function cleanString(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function actorOf(req: AuthedRequest): { id: string; displayName: string } {
  return { id: req.uid, displayName: req.user.displayName };
}
