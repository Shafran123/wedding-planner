import { Schema, model } from "mongoose";
import { EVENT_STATUSES, EVENT_TYPES } from "@wedding/shared";

const eventSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: EVENT_TYPES, default: "ceremony" },
    date: { type: Date, required: true },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", default: null },
    description: { type: String, default: "" },
    dressCode: { type: String, default: "" },
    guestCount: { type: Number, default: null },
    status: { type: String, enum: EVENT_STATUSES, default: "planned" },
  },
  { timestamps: true },
);

export const Event = model("Event", eventSchema);
