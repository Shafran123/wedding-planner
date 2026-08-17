import type { Schema } from "mongoose";

export interface SoftDeletableDocument {
  softDelete(userId: string): Promise<unknown>;
}

export function asSoftDeletable(doc: unknown): SoftDeletableDocument {
  return doc as SoftDeletableDocument;
}

export function softDeletable(schema: Schema): void {
  schema.add({
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
  });

  schema.pre("find", function () {
    this.where({ deletedAt: null });
  });
  schema.pre("findOne", function () {
    this.where({ deletedAt: null });
  });
  schema.pre("countDocuments", function () {
    this.where({ deletedAt: null });
  });
  schema.pre("findOneAndUpdate", function () {
    this.where({ deletedAt: null });
  });

  schema.methods.softDelete = function (userId: string): Promise<unknown> {
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
  };
}
