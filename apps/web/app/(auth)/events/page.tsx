"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Plus, CalendarDays, Clock } from "lucide-react";
import type { Event } from "@wedding/shared";
import { swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty";
import { formatDate } from "@/lib/format";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { EventFormDialog } from "@/components/features/event-form";

export default function EventsPage() {
  const { role, wedding } = useWedding();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  const { data, error, isLoading } = useSWR<{ events: Event[] }>(
    "/api/events",
    swrFetcher,
  );

  const canWrite = role !== "viewer";
  const events = useMemo(() => data?.events ?? [], [data]);

  const weddingDay = wedding?.weddingDate ? wedding.weddingDate.slice(0, 10) : null;
  const timeline = events
    .filter((e) => e.date.slice(0, 10) === weddingDay && e.startTime)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Every function of your wedding — from engagement to send-off."
        action={
          canWrite && (
            <Button variant="gold" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New event
            </Button>
          )
        }
      />

      {isLoading && <ListSkeleton rows={4} />}
      {error && <ErrorState onRetry={() => void mutate("/api/events")} />}

      {data && data.events.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Add your engagement, Nikah, mehendi, ceremony, reception — the moments that make your wedding."
          actionLabel={canWrite ? "Add event" : undefined}
          onAction={() => setCreateOpen(true)}
        />
      )}

      {timeline.length > 0 && (
        <Card className="border-gold-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" /> Wedding day timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-0 border-l-2 border-gold-soft pl-6">
              {timeline.map((event) => (
                <li key={event.id} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-gold bg-white" aria-hidden />
                  <Link href={`/events/${event.id}`} className="group block">
                    <p className="text-sm font-semibold tabular-nums text-gold">{event.startTime}</p>
                    <p className="font-medium text-charcoal group-hover:text-gold">{event.name}</p>
                    {event.locationName && (
                      <p className="text-xs text-stone-warm">{event.locationName}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group rounded-2xl border border-sand bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-charcoal group-hover:text-gold">{event.name}</p>
                <span className="text-xs text-stone-warm">{EVENT_TYPE_LABELS[event.type]}</span>
              </div>
              <p className="mt-2 text-sm text-stone-warm">
                {formatDate(event.date)}
                {event.startTime ? ` · ${event.startTime}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-warm">
                {event.locationName && <span>📍 {event.locationName}</span>}
                {event.guestCount !== undefined && <span>👥 {event.guestCount} guests</span>}
                {event.dressCode && <span>✨ {event.dressCode}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <EventFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          void Promise.all([mutate("/api/events"), mutate("/api/dashboard")]);
        }}
      />
      {editing && (
        <EventFormDialog
          open
          event={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void Promise.all([mutate("/api/events"), mutate("/api/dashboard")]);
          }}
        />
      )}
    </div>
  );
}
