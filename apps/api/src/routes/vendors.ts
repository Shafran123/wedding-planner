import { Router } from "express";
import { vendorSchema, vendorUpdateSchema } from "@wedding/shared";
import type { Vendor as VendorDTO } from "@wedding/shared";
import { Vendor } from "../models/index.js";
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
import { asSoftDeletable } from "../models/softDelete.js";

function serializeVendor(doc: Record<string, unknown>): VendorDTO {
  return {
    id: String(doc._id),
    weddingId: String(doc.weddingId),
    name: doc.name as string,
    category: doc.category as string,
    contactName: (doc.contactName as string) || undefined,
    phone: (doc.phone as string) || undefined,
    email: (doc.email as string) || undefined,
    website: (doc.website as string) || undefined,
    instagram: (doc.instagram as string) || undefined,
    address: (doc.address as string) || undefined,
    priceMinor: (doc.priceMinor as number | null) ?? undefined,
    status: doc.status as VendorDTO["status"],
    rating: (doc.rating as number | null) ?? undefined,
    notes: (doc.notes as string) || undefined,
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
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      filter.name = { $regex: String(req.query.q), $options: "i" };
    }

    const vendors = await Vendor.find(filter).limit(500).sort({ name: 1 }).lean();
    res.json({
      vendors: vendors.map((v) =>
        serializeVendor(v as unknown as Record<string, unknown>),
      ),
    });
  }),
);

router.post(
  "/",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const input = validate(vendorSchema, req.body);

    const vendor = await Vendor.create({
      weddingId: authed.weddingId,
      name: input.name,
      category: input.category,
      contactName: input.contactName ?? "",
      phone: input.phone ?? "",
      email: input.email ?? "",
      website: input.website ?? "",
      instagram: input.instagram ?? "",
      address: input.address ?? "",
      priceMinor: input.priceMinor ?? null,
      status: input.status,
      rating: input.rating ?? null,
      notes: input.notes ?? "",
    });

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "vendor_created",
      entityType: "vendor",
      entityId: String(vendor._id),
      message: `${authed.user.displayName} added the vendor "${input.name}"`,
    });

    res.status(201).json({ vendor: { id: String(vendor._id) } });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requireWedding,
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    }).lean();
    if (!vendor) throw new NotFoundError("We couldn't find that vendor.");
    res.json({
      vendor: serializeVendor(vendor as unknown as Record<string, unknown>),
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
    const input = validate(vendorUpdateSchema, req.body);

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!vendor) throw new NotFoundError("We couldn't find that vendor.");

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      vendor.set(key, key === "website" ? cleanString(value as string) ?? "" : value);
    }
    await vendor.save();

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "vendor_updated",
      entityType: "vendor",
      entityId: String(vendor._id),
      message: `${authed.user.displayName} updated the vendor "${vendor.name}"`,
    });

    res.json({ vendor: { id: String(vendor._id) } });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireWedding,
  requireRole("owner", "partner", "planner"),
  asyncHandler(async (req, res) => {
    const authed = req as AuthedRequest;
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      weddingId: authed.weddingId,
    });
    if (!vendor) throw new NotFoundError("We couldn't find that vendor.");

    await asSoftDeletable(vendor).softDelete(authed.uid);

    await writeActivity({
      weddingId: authed.weddingId,
      actor: actorOf(authed),
      type: "vendor_deleted",
      entityType: "vendor",
      message: `${authed.user.displayName} removed the vendor "${vendor.name}"`,
    });

    res.status(204).end();
  }),
);

export default router;
