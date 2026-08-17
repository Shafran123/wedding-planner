import { Schema, model } from "mongoose";
import { VENDOR_STATUSES } from "@wedding/shared";
import { softDeletable } from "./softDelete.js";

const vendorSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    contactName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    instagram: { type: String, default: "" },
    address: { type: String, default: "" },
    priceMinor: { type: Number, default: null },
    status: { type: String, enum: VENDOR_STATUSES, default: "researching" },
    rating: { type: Number, min: 0, max: 5, default: null },
    meetingDate: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

softDeletable(vendorSchema);

export const Vendor = model("Vendor", vendorSchema);
