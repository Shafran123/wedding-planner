import type { ActivityType } from "@wedding/shared";
import { Activity } from "../models/index.js";

export interface Actor {
  id: string;
  displayName: string;
}

export interface ActivityInput {
  weddingId: string;
  actor: Actor;
  type: ActivityType;
  entityType: string;
  entityId?: string;
  message: string;
}

export async function writeActivity(input: ActivityInput): Promise<void> {
  await Activity.create({
    weddingId: input.weddingId,
    actorId: input.actor.id,
    actorName: input.actor.displayName,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    message: input.message,
  });
}
