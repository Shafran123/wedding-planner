import { Schema, model } from "mongoose";
import { NOTIFICATION_TYPES } from "@wedding/shared";

const notificationSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true },
    userId: { type: String, required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ weddingId: 1, userId: 1, read: 1 });
notificationSchema.index({ weddingId: 1, userId: 1, createdAt: -1 });

export const Notification = model("Notification", notificationSchema);
