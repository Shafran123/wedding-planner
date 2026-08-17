import { Schema, model } from "mongoose";
import { NOTE_CATEGORIES } from "@wedding/shared";
import { softDeletable } from "./softDelete.js";

const noteSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    category: { type: String, enum: NOTE_CATEGORIES, default: "general" },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

softDeletable(noteSchema);

export const Note = model("Note", noteSchema);
