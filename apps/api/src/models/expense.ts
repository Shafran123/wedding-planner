import { Schema, model } from "mongoose";
import { EXPENSE_PAYMENT_STATUSES } from "@wedding/shared";
import { softDeletable } from "./softDelete.js";

const expenseSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "BudgetCategory", default: null },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    estimatedMinor: { type: Number, required: true },
    actualMinor: { type: Number, default: null },
    currency: { type: String, enum: ["AED", "LKR"], default: "AED" },
    rate: { type: Number, default: 1 },
    baseEstimatedMinor: { type: Number, default: null },
    baseActualMinor: { type: Number, default: null },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
    paymentStatus: { type: String, enum: EXPENSE_PAYMENT_STATUSES, default: "unpaid" },
    dueDate: { type: Date, default: null },
    notes: { type: String, default: "" },
    receiptUrl: { type: String, default: null },
  },
  { timestamps: true },
);

softDeletable(expenseSchema);

export const Expense = model("Expense", expenseSchema);
