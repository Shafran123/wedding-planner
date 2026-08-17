import { Schema, model } from "mongoose";
import { INVITATION_STATUSES, ROLES } from "@wedding/shared";

const invitationSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    email: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: INVITATION_STATUSES, default: "pending" },
    invitedBy: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Invitation = model("Invitation", invitationSchema);
