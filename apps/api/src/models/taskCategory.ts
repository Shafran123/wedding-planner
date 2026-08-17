import { Schema, model } from "mongoose";

const taskCategorySchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export const TaskCategory = model("TaskCategory", taskCategorySchema);
