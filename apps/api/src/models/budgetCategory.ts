import { Schema, model } from "mongoose";

const budgetCategorySchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    name: { type: String, required: true },
    plannedMinor: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const BudgetCategory = model("BudgetCategory", budgetCategorySchema);
