import { Schema, model } from "mongoose";
import { ATTACHMENT_KINDS } from "@wedding/shared";

const attachmentSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    kind: { type: String, enum: ATTACHMENT_KINDS, required: true },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true },
);

export const Attachment = model("Attachment", attachmentSchema);
