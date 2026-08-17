import { Schema, model } from "mongoose";
import { LOCATION_STATUSES, LOCATION_TYPES } from "@wedding/shared";

const locationSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: LOCATION_TYPES, default: "venue" },
    address: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    website: { type: String, default: "" },
    contactName: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    capacity: { type: Number, default: null },
    estimatedCostMinor: { type: Number, default: null },
    actualCostMinor: { type: Number, default: null },
    status: { type: String, enum: LOCATION_STATUSES, default: "researching" },
    visitDate: { type: Date, default: null },
    notes: { type: String, default: "" },
    images: { type: [String], default: [] },
    selectedVenue: { type: Boolean, default: false },
    parking: { type: Boolean, default: null },
    catering: { type: Boolean, default: null },
    decoration: { type: Boolean, default: null },
    accommodation: { type: Boolean, default: null },
  },
  { timestamps: true },
);

export const Location = model("Location", locationSchema);
