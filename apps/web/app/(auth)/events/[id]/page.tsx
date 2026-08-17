"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import type { Event } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader, ErrorState } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EventFormDialog } from "@/components/features/event-form";
import { formatDate } from "@/lib/format";
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/labels";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useWedding();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ event: Event }>(
    `/api/events/${id}`,
    swrFetcher,
  );

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return <ErrorState message="We couldn't find that event." onRetry={() => router.push("/events")} />;
  }

  const event = data.event;
  const canWrite = role !== "viewer";

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api(`/api/events/${event.id}`, { method: "DELETE" });
      await mutate("/api/events");
      router.push("/events");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/events")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-warm hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{event.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="gold">{EVENT_TYPE_LABELS[event.type]}</Badge>
            <Badge variant="outline">{EVENT_STATUS_LABELS[event.status]}</Badge>
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(true)}>
              <Trash2 className="h-3.5 w-3.5 text-red-700" />
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Date</dt>
              <dd className="mt-1 text-charcoal">{formatDate(event.date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Time</dt>
              <dd className="mt-1 text-charcoal">
                {event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Location</dt>
              <dd className="mt-1 text-charcoal">{event.locationName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Guests</dt>
              <dd className="mt-1 text-charcoal">{event.guestCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Dress code</dt>
              <dd className="mt-1 text-charcoal">{event.dressCode || "—"}</dd>
            </div>
          </dl>
          {event.description && (
            <p className="mt-4 whitespace-pre-wrap border-t border-sand pt-4 text-sm text-charcoal">
              {event.description}
            </p>
          )}
        </CardContent>
      </Card>

      <EventFormDialog
        open={editing}
        event={event}
        onOpenChange={setEditing}
        onSaved={() => {
          setEditing(false);
          void Promise.all([mutate(`/api/events/${event.id}`), mutate("/api/events")]);
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Remove event?"
        description={`"${event.name}" will be removed.`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
