import { Router } from "express";
import { locationSchema, locationUpdateSchema } from "@wedding/shared";
import type { Location as LocationDTO } from "@wedding/shared";
import { Location } from "../models/index.js";
import { NotFoundError } from "../errors.js";
import { writeActivity } from "../services/activity.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  requireAuth,
  requireWedding,
  requireRole,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { actorOf, cleanString, iso, validate } from "./helpers.js";

function serializeLocation(doc: Record<string, unknown>): LocationDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name as string,
    type: doc.type as LocationDTO["type"],
    address: (doc.address as string) || undefined,
    latitude: (doc.latitude as number | null) ?? undefined,
    longitude: (doc.longitude as number | null) ?? undefined,
    website: (doc.website as string) || undefined,
    contactName: (doc.contactName as string) || undefined,
    contactPhone: (doc.contactPhone as string) || undefined,
    capacity: (doc.capacity as number | null) ?? undefined,
    estimatedCostMinor: (doc.estimatedCostMinor as number | null) ?? undefined,
    actualCostMinor: (doc.actualCostMinor as number | null) ?? undefined,
    status: doc.status as LocationDTO["status"],
    visitDate: iso(doc.visitDate as Date | null),
    notes: (doc.notes as string) || undefined,
    images: (doc.images as string[]) ?? [],
    selectedVenue: (doc.selectedVenue as boolean) ?? false,
    parking: (doc.parking as boolean | null) ?? undefined,
    catering: (doc.catering as boolean | null) ?? undefined,
    decoration: (doc.decoration as boolean | null) ?? undefined,
    accommodation: (doc.accommodation as boolean | null) ?? undefined,
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
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.venue === "true") filter.type = "venue";

    const locations = await Location.find(filter).limit(500).sort({ name: 1 }).lean();
    res.json({
      locations: locations.map((l) =>
        serializeLocation(l as unknown as Record<string, unknown>),
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
    const input = validate(locationSchema, req.body);

    const location = await Location.create({
      weddingId: authed.weddingId,
      name: input.name,
      type: input.type,
      address: input.address ?? "",
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      website: input.website ?? "",
      contactName: input.contactName ?? "",
      contactPhone: input.contactPhone ?? "",
      capacity: input.capacity ?? null,
      estimatedCostMinor: input.estimatedCostMinor ?? null,
      actualCostMinor: input.actualCostMinor ?? null,
      status: input.status,
      visitDate: input.visitDate ? new Date(input.visitDate) : null,
      notes: input.notes ?? "",
      images: input.images ?? [],
      parking: input.parking ?? null,
      catering: input.catering ?? null,
      decoration: input.decoration ?? null,
      accommodation: input.accommodation ?? null,
    });

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "location_created",
      entityType: "location",
      entityId: String(location._id),
      message: `${authed.user.displayName} added the location "${input.name}"`,
    });

    res.status(201).json({ location: { id: String(location._id) } });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const location = await Location.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!location) throw new NotFoundError("We couldn't find that location.");
    res.json({
      location: serializeLocation(location as unknown as Record<string, unknown>),
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
    const input = validate(locationUpdateSchema, req.body);

    const location = await Location.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!location) throw new NotFoundError("We couldn't find that location.");

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      if (key === "visitDate") {
        location.set("visitDate", value ? new Date(value as string) : null);
      } else if (key === "website") {
        location.set(key, cleanString(value as string) ?? "");
      } else {
        location.set(key, value);
      }
    }
    await location.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "location_updated",
      entityType: "location",
      entityId: String(location._id),
      message: `${authed.user.displayName} updated the location "${location.name}"`,
    });

    res.json({ location: { id: String(location._id) } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const location = await Location.findOneAndDelete({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!location) throw new NotFoundError("We couldn't find that location.");

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "location_updated",
      entityType: "location",
      message: `${authed.user.displayName} removed the location "${location.name}"`,
    });

    res.status(204).end();
  }),
);

router.post(
  "/:id/select",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const location = await Location.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!location) throw new NotFoundError("We couldn't find that location.");

    await Location.updateMany(
      { weddingId: authed.weddingId },
      { selectedVenue: false },
    );
    location.selectedVenue = true;
    location.status = "booked";
    await location.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "location_updated",
      entityType: "location",
      entityId: String(location._id),
      message: `${authed.user.displayName} selected "${location.name}" as the venue`,
    });

    res.json({ location: { id: String(location._id), selectedVenue: true } });
  }),
);

export default router;
