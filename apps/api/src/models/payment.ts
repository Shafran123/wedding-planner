import { Schema, model } from "mongoose";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@wedding/shared";
import { softDeletable } from "./softDelete.js";

const paymentSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    expenseId: { type: Schema.Types.ObjectId, ref: "Expense", default: null },
    amountMinor: { type: Number, required: true },
    paymentDate: { type: Date, default: null },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    method: { type: String, enum: PAYMENT_METHODS, default: "bank_transfer" },
    reference: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

softDeletable(paymentSchema);

export const Payment = model("Payment", paymentSchema);
