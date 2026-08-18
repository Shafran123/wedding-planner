import { Schema, model } from "mongoose";
import { TASK_PRIORITIES, TASK_STATUSES } from "@wedding/shared";

const taskSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "TaskCategory", default: null },
    status: { type: String, enum: TASK_STATUSES, default: "todo" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    dueDate: { type: Date, default: null },
    assignedTo: { type: String, default: null },
    estimatedCostMinor: { type: Number, default: null },
    actualCostMinor: { type: Number, default: null },
    currency: { type: String, enum: ["AED", "LKR"], default: "AED" },
    rate: { type: Number, default: 1 },
    baseEstimatedCostMinor: { type: Number, default: null },
    baseActualCostMinor: { type: Number, default: null },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Task = model("Task", taskSchema);
