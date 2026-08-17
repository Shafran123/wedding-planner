import { Router } from "express";
import { noteSchema, noteUpdateSchema } from "@wedding/shared";
import type { Note as NoteDTO } from "@wedding/shared";
import { Member, Note } from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, iso, validate } from "./helpers.js";
import { asSoftDeletable } from "../models/softDelete.js";

function serializeNote(
  doc: Record<string, unknown>,
  memberNames: Map<string, string>,
): NoteDTO {
  const createdBy = doc.createdBy as string;
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    title: doc.title as string,
    content: doc.content as string,
    category: doc.category as NoteDTO["category"],
    createdBy,
    createdByName: memberNames.get(createdBy),
    createdAt: iso(doc.createdAt as Date) as string,
    updatedAt: iso(doc.updatedAt as Date) as string,
  };
}

const router = Router();

router.get(
  "/",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const filter: Record<string, unknown> = { weddingId: authed.weddingId };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q) {
      filter.title = { $regex: String(req.query.q), $options: "i" };
    }

    const [notes, members] = await Promise.all([
      Note.find(filter).limit(500).sort({ updatedAt: -1 }).lean(),
      Member.find({ weddingId: authed.weddingId }).lean(),
    ]);
    const memberNames = new Map(members.map((m) => [m.userId, m.displayName]));

    res.json({
      notes: notes.map((n) =>
        serializeNote(n as unknown as Record<string, unknown>, memberNames),
      ),
    });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(noteSchema, req.body);

    const note = await Note.create({
      weddingId: authed.weddingId,
      title: input.title,
      content: input.content,
      category: input.category,
      createdBy: authed.uid,
    });

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "note_created",
      entityType: "note",
      entityId: String(note._id),
      message: `${authed.user.displayName} added the note "${input.title}"`,
    });

    res.status(201).json({ note: { id: String(note._id) } });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const note = await Note.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!note) throw new NotFoundError("We couldn't find that note.");
    res.json({
      note: serializeNote(note as unknown as Record<string, unknown>, new Map()),
    });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(noteUpdateSchema, req.body);

    const note = await Note.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!note) throw new NotFoundError("We couldn't find that note.");

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) note.set(key, value);
    }
    await note.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "note_updated",
      entityType: "note",
      entityId: String(note._id),
      message: `${authed.user.displayName} updated the note "${note.title}"`,
    });

    res.json({ note: { id: String(note._id) } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const note = await Note.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!note) throw new NotFoundError("We couldn't find that note.");

    await asSoftDeletable(note).softDelete(authed.uid);

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "note_updated",
      entityType: "note",
      message: `${authed.user.displayName} removed the note "${note.title}"`,
    });

    res.status(204).end();
  }),
);

export default router;
