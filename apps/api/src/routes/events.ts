import { Router } from "express";
import { eventSchema, eventUpdateSchema } from "@wedding/shared";
import type { Event as EventDTO } from "@wedding/shared";
import { Event, Location } from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import { maybeNotifyEventUpcoming } from "../services/notifications.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, cleanString, iso, validate } from "./helpers.js";

function serializeEvent(
  doc: Record<string, unknown>,
  locationNames: Map<string, string>,
): EventDTO {
  const locationId = doc.locationId ? String(doc.locationId) : undefined;
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name as string,
    type: doc.type as EventDTO["type"],
    date: iso(doc.date as Date) as string,
    startTime: (doc.startTime as string) || undefined,
    endTime: (doc.endTime as string) || undefined,
    locationId,
    locationName: locationId ? locationNames.get(locationId) : undefined,
    description: (doc.description as string) || undefined,
    dressCode: (doc.dressCode as string) || undefined,
    guestCount: (doc.guestCount as number | null) ?? undefined,
    status: doc.status as EventDTO["status"],
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
    if (req.query.type) filter.type = req.query.type;

    const [events, locations] = await Promise.all([
      Event.find(filter).limit(500).lean(),
      Location.find({ weddingId: authed.weddingId }).lean(),
    ]);
    const locationNames = new Map(locations.map((l) => [String(l._id), l.name]));

    const serialized = events
      .map((e) => serializeEvent(e as unknown as Record<string, unknown>, locationNames))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ events: serialized });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(eventSchema, req.body);

    const event = await Event.create({
      weddingId: authed.weddingId,
      name: input.name,
      type: input.type,
      date: new Date(input.date),
      startTime: input.startTime ?? "",
      endTime: input.endTime ?? "",
      locationId: cleanString(input.locationId) ?? null,
      description: input.description ?? "",
      dressCode: input.dressCode ?? "",
      guestCount: input.guestCount ?? null,
      status: input.status,
    });

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "event_created",
      entityType: "event",
      entityId: String(event._id),
      message: `${authed.user.displayName} created the event "${input.name}"`,
    });

    await maybeNotifyEventUpcoming(
      authed.weddingId,
      { date: event.date, name: event.name },
      authed.uid,
    );

    res.status(201).json({ event: { id: String(event._id) } });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const event = await Event.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!event) throw new NotFoundError("We couldn't find that event.");

    const locations = await Location.find({ weddingId: authed.weddingId }).lean();
    const locationNames = new Map(locations.map((l) => [String(l._id), l.name]));

    res.json({
      event: serializeEvent(event as unknown as Record<string, unknown>, locationNames),
    });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(eventUpdateSchema, req.body);

    const event = await Event.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!event) throw new NotFoundError("We couldn't find that event.");

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "date") {
        event.set("date", new Date(value as string));
      } else if (key === "locationId") {
        event.set("locationId", cleanString(value as string) ?? null);
      } else {
        event.set(key, value);
      }
    }
    await event.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "event_updated",
      entityType: "event",
      entityId: String(event._id),
      message: `${authed.user.displayName} updated the event "${event.name}"`,
    });

    res.json({ event: { id: String(event._id) } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!event) throw new NotFoundError("We couldn't find that event.");

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "event_updated",
      entityType: "event",
      message: `${authed.user.displayName} removed the event "${event.name}"`,
    });

    res.status(204).end();
  }),
);

export default router;
