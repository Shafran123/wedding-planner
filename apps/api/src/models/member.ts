import { Schema, model } from "mongoose";
import { ROLES } from "@wedding/shared";

const memberSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ROLES, required: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: true },
);

memberSchema.index({ weddingId: 1, userId: 1 }, { unique: true });

export const Member = model("Member", memberSchema);
