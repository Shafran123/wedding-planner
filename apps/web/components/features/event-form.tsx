"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Event, Location } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
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
import { EVENT_TYPES, EVENT_STATUSES } from "@wedding/shared";
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/labels";

const schema = z
  .object({
    name: z.string().min(1, "Event name is required.").max(200),
    type: z.string().default("ceremony"),
    date: z.string().min(1, "Event date is required."),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    locationId: z.string().optional(),
    description: z.string().optional(),
    dressCode: z.string().optional(),
    guestCount: z.string().optional(),
    status: z.string().default("planned"),
  })
  .refine(
    (data) => !data.startTime || !data.endTime || data.startTime < data.endTime,
    { message: "End time must be after start time.", path: ["endTime"] },
  );
type FormValues = z.input<typeof schema>;

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event;
  onSaved: () => void;
}) {
  const { data: locationData } = useSWR<{ locations: Location[] }>(
    open ? "/api/locations" : null,
    swrFetcher,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "ceremony",
      date: "",
      startTime: "",
      endTime: "",
      locationId: "",
      description: "",
      dressCode: "",
      guestCount: "",
      status: "planned",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: event?.name ?? "",
        type: event?.type ?? "ceremony",
        date: event?.date ? event.date.slice(0, 10) : "",
        startTime: event?.startTime ?? "",
        endTime: event?.endTime ?? "",
        locationId: event?.locationId ?? "",
        description: event?.description ?? "",
        dressCode: event?.dressCode ?? "",
        guestCount: event?.guestCount !== undefined ? String(event.guestCount) : "",
        status: event?.status ?? "planned",
      });
      setError(null);
    }
  }, [open, event, reset]);

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: values.name,
        type: values.type,
        date: new Date(`${values.date}T12:00:00`).toISOString(),
        startTime: values.startTime || undefined,
        endTime: values.endTime || undefined,
        locationId: values.locationId || undefined,
        description: values.description || undefined,
        dressCode: values.dressCode || undefined,
        guestCount: values.guestCount ? Number(values.guestCount) : undefined,
        status: values.status,
      };
      if (event) {
        await api(`/api/events/${event.id}`, { method: "PATCH", body });
      } else {
        await api("/api/events", { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save this event.");
    } finally {
      setBusy(false);
    }
  };

  const locations = locationData?.locations ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>Schedule a function of your wedding.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-name">Name</Label>
              <Input id="ev-name" autoFocus {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-type">Type</Label>
              <Select id="ev-type" {...register("type")}>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Date</Label>
              <Input id="ev-date" type="date" {...register("date")} />
              <FieldError message={errors.date?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-location">Location</Label>
              <Select id="ev-location" {...register("locationId")}>
                <option value="">None</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-start">Start time</Label>
              <Input id="ev-start" type="time" {...register("startTime")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end">End time</Label>
              <Input id="ev-end" type="time" {...register("endTime")} />
              <FieldError message={errors.endTime?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-guests">Guest count</Label>
              <Input id="ev-guests" inputMode="numeric" {...register("guestCount")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-status">Status</Label>
              <Select id="ev-status" {...register("status")}>
                {EVENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{EVENT_STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-dress">Dress code</Label>
              <Input id="ev-dress" placeholder="e.g. Formal, emerald green" {...register("dressCode")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-description">Description</Label>
            <Textarea id="ev-description" rows={2} {...register("description")} />
          </div>
          {error && <FieldError message={error} />}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />} {event ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
