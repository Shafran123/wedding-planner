"use client";

import { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Location } from "@wedding/shared";
import { api } from "@/lib/api";
import { parseToMinor } from "@/lib/money";
import { getClientStorage, ref, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { useWedding } from "@/contexts/wedding";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { Spinner } from "@/components/ui/empty";
import { LOCATION_TYPES, LOCATION_STATUSES } from "@wedding/shared";
import { LOCATION_STATUS_LABELS, LOCATION_TYPE_LABELS } from "@/lib/labels";

const schema = z.object({
  name: z.string().min(1, "Location name is required.").max(200),
  type: z.string().default("venue"),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  website: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  capacity: z.string().optional(),
  estimatedInput: z.string().optional(),
  actualInput: z.string().optional(),
  status: z.string().default("researching"),
  notes: z.string().optional(),
  parking: z.string().optional(),
  catering: z.string().optional(),
  decoration: z.string().optional(),
  accommodation: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

const triState = (v: string | undefined): boolean | undefined =>
  v === "" ? undefined : v === "yes";

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location;
  onSaved: () => void;
}) {
  const { wedding } = useWedding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "venue",
      address: "",
      latitude: "",
      longitude: "",
      website: "",
      contactName: "",
      contactPhone: "",
      capacity: "",
      estimatedInput: "",
      actualInput: "",
      status: "researching",
      notes: "",
      parking: "",
      catering: "",
      decoration: "",
      accommodation: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: location?.name ?? "",
        type: location?.type ?? "venue",
        address: location?.address ?? "",
        latitude: location?.latitude !== undefined ? String(location.latitude) : "",
        longitude: location?.longitude !== undefined ? String(location.longitude) : "",
        website: location?.website ?? "",
        contactName: location?.contactName ?? "",
        contactPhone: location?.contactPhone ?? "",
        capacity: location?.capacity !== undefined ? String(location.capacity) : "",
        estimatedInput: location?.estimatedCostMinor !== undefined ? String(location.estimatedCostMinor / 100) : "",
        actualInput: location?.actualCostMinor !== undefined ? String(location.actualCostMinor / 100) : "",
        status: location?.status ?? "researching",
        notes: location?.notes ?? "",
        parking: location?.parking === undefined ? "" : location.parking ? "yes" : "no",
        catering: location?.catering === undefined ? "" : location.catering ? "yes" : "no",
        decoration: location?.decoration === undefined ? "" : location.decoration ? "yes" : "no",
        accommodation: location?.accommodation === undefined ? "" : location.accommodation ? "yes" : "no",
      });
      setFiles([]);
      setError(null);
    }
  }, [open, location, reset]);

  const uploadImages = async (weddingId: string): Promise<string[]> => {
    const storage = getClientStorage();
    if (!storage || files.length === 0) return location?.images ?? [];
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 5)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `weddings/${weddingId}/locations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        urls.push(await getDownloadURL(fileRef));
      }
      return [...(location?.images ?? []), ...urls];
    } catch {
      setError("We couldn't upload the photos.");
      return location?.images ?? [];
    }
  };

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: values.name,
        type: values.type,
        address: values.address || undefined,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
        website: values.website || undefined,
        contactName: values.contactName || undefined,
        contactPhone: values.contactPhone || undefined,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        estimatedCostMinor: values.estimatedInput ? (parseToMinor(values.estimatedInput) ?? undefined) : undefined,
        actualCostMinor: values.actualInput ? (parseToMinor(values.actualInput) ?? undefined) : undefined,
        status: values.status,
        notes: values.notes || undefined,
        parking: triState(values.parking),
        catering: triState(values.catering),
        decoration: triState(values.decoration),
        accommodation: triState(values.accommodation),
      };
      const images = wedding?.id ? await uploadImages(wedding.id) : [];
      if (location) {
        await api(`/api/locations/${location.id}`, { method: "PATCH", body: { ...body, images } });
      } else {
        await api("/api/locations", { method: "POST", body: { ...body, images } });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save this location.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? "Edit location" : "New location"}</DialogTitle>
          <DialogDescription>Address and coordinates power “Open in Maps”.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="l-name">Name</Label>
              <Input id="l-name" autoFocus {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-type">Type</Label>
              <Select id="l-type" {...register("type")}>
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="l-address">Address</Label>
              <Input id="l-address" placeholder="Street, city" {...register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-lat">Latitude</Label>
              <Input id="l-lat" inputMode="decimal" placeholder="25.2048" {...register("latitude")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-lng">Longitude</Label>
              <Input id="l-lng" inputMode="decimal" placeholder="55.2708" {...register("longitude")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-capacity">Capacity</Label>
              <Input id="l-capacity" inputMode="numeric" {...register("capacity")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-status">Status</Label>
              <Select id="l-status" {...register("status")}>
                {LOCATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{LOCATION_STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-estimated">Estimated cost</Label>
              <Input id="l-estimated" inputMode="decimal" placeholder="0.00" {...register("estimatedInput")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-actual">Actual cost</Label>
              <Input id="l-actual" inputMode="decimal" placeholder="0.00" {...register("actualInput")} />
            </div>
            {(["parking", "catering", "decoration", "accommodation"] as const).map((key) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`l-${key}`}>{key[0]?.toUpperCase()}{key.slice(1)}</Label>
                <Select id={`l-${key}`} {...register(key)}>
                  <option value="">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="l-photos">Photos</Label>
              <Input
                id="l-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-notes">Notes</Label>
            <Textarea id="l-notes" rows={2} {...register("notes")} />
          </div>
          {error && <FieldError message={error} />}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />} {location ? "Save changes" : "Add location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
