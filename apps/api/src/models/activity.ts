import { Schema, model } from "mongoose";
import { ACTIVITY_TYPES } from "@wedding/shared";

const activitySchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

activitySchema.index({ weddingId: 1, createdAt: -1 });

export const Activity = model("Activity", activitySchema);
