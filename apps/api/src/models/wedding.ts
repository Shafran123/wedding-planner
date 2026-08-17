import { Schema, model } from "mongoose";

const weddingSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    weddingName: { type: String, required: true },
    partnerOneName: { type: String, required: true },
    partnerTwoName: { type: String, default: "" },
    weddingDate: { type: Date, required: true },
    timezone: { type: String, default: "Asia/Dubai" },
    currency: { type: String, default: "AED" },
    estimatedGuestCount: { type: Number },
    totalBudgetMinor: { type: Number, default: 0 },
    weddingType: { type: String },
    location: { type: String },
    coverImageUrl: { type: String },
    plan: { type: String, default: "free" },
    subscriptionStatus: { type: String },
    subscriptionId: { type: String },
    trialEndsAt: { type: Date },
  },
  { timestamps: true },
);

export const Wedding = model("Wedding", weddingSchema);
