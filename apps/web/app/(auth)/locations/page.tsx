"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Plus, MapPin, Star, GitCompareArrows } from "lucide-react";
import type { Location } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty";
import { LocationStatusBadge } from "@/components/shared/badges";
import { formatMinor } from "@/lib/format";
import { LOCATION_TYPE_LABELS } from "@/lib/labels";
import { LocationFormDialog } from "@/components/features/location-form";
import { cn } from "@/lib/utils";

export default function LocationsPage() {
  const { role, wedding } = useWedding();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [compare, setCompare] = useState(false);

  const { data, error, isLoading } = useSWR<{ locations: Location[] }>(
    "/api/locations",
    swrFetcher,
  );

  const canWrite = role === "owner" || role === "partner";
  const currency = wedding?.currency ?? "AED";
  const locations = useMemo(() => data?.locations ?? [], [data]);
  const venues = locations.filter((l) => l.type === "venue");

  const selectVenue = async (location: Location) => {
    await api(`/api/locations/${location.id}/select`, { method: "POST" });
    await Promise.all([mutate("/api/locations"), mutate("/api/dashboard")]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Every place your wedding touches — ceremony, reception, hotels, and more."
        action={
          canWrite && (
            <div className="flex gap-2">
              {venues.length >= 2 && (
                <Button variant="outline" onClick={() => setCompare(true)}>
                  <GitCompareArrows className="h-4 w-4" /> Compare venues
                </Button>
              )}
              <Button variant="gold" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> New location
              </Button>
            </div>
          )
        }
      />

      {isLoading && <ListSkeleton rows={4} />}
      {error && <ErrorState onRetry={() => void mutate("/api/locations")} />}

      {data && data.locations.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your ceremony site, reception venue, hotels — every place in your wedding story."
          actionLabel={canWrite ? "Add location" : undefined}
          onAction={() => setCreateOpen(true)}
        />
      )}

      {locations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Link
              key={location.id}
              href={`/locations/${location.id}`}
              className={cn(
                "group relative rounded-2xl border border-sand bg-white p-5 transition-shadow hover:shadow-md",
                location.selectedVenue && "border-gold",
              )}
            >
              {location.selectedVenue && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Star className="h-3 w-3 fill-white" /> Selected venue
                </span>
              )}
              {location.images.length > 0 && (
                <img
                  src={location.images[0]}
                  alt=""
                  className="mb-3 h-32 w-full rounded-xl object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-charcoal group-hover:text-gold">
                    {location.name}
                  </p>
                  <p className="text-xs text-stone-warm">
                    {LOCATION_TYPE_LABELS[location.type]}
                    {location.capacity ? ` · ${location.capacity} guests` : ""}
                  </p>
                </div>
                <LocationStatusBadge status={location.status} />
              </div>
              {location.estimatedCostMinor !== undefined && (
                <p className="mt-3 text-sm font-semibold tabular-nums text-charcoal">
                  {formatMinor(location.estimatedCostMinor, currency)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <LocationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          void Promise.all([mutate("/api/locations"), mutate("/api/dashboard")]);
        }}
      />
      {editing && (
        <LocationFormDialog
          open
          location={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void Promise.all([mutate("/api/locations"), mutate("/api/dashboard")]);
          }}
        />
      )}

      {compare && (
        <VenueComparison venues={venues} currency={currency} onSelect={selectVenue} onClose={() => setCompare(false)} />
      )}
    </div>
  );
}

function VenueComparison({
  venues,
  currency,
  onSelect,
  onClose,
}: {
  venues: Location[];
  currency: string;
  onSelect: (venue: Location) => Promise<void>;
  onClose: () => void;
}) {
  const rows: { label: string; render: (v: Location) => React.ReactNode }[] = [
    { label: "Price", render: (v) => (v.estimatedCostMinor !== undefined ? formatMinor(v.estimatedCostMinor, currency) : "—") },
    { label: "Capacity", render: (v) => v.capacity ?? "—" },
    { label: "Location", render: (v) => v.address ?? "—" },
    { label: "Parking", render: (v) => v.parking },
    { label: "Catering", render: (v) => v.catering },
    { label: "Decoration", render: (v) => v.decoration },
    { label: "Accommodation", render: (v) => v.accommodation },
    { label: "Notes", render: (v) => v.notes ?? "—" },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Venue comparison</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr>
              <th className="pr-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-warm"></th>
              {venues.map((v) => (
                <th key={v.id} className="min-w-40 px-2 pb-3 text-left">
                  <p className="font-medium text-charcoal">{v.name}</p>
                  {v.selectedVenue ? (
                    <span className="text-xs font-semibold text-gold">Selected ✓</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => void onSelect(v)}
                    >
                      Select this venue
                    </Button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-sand">
                <td className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-stone-warm">
                  {row.label}
                </td>
                {venues.map((v) => {
                  const value = row.render(v);
                  const shown =
                    typeof value === "boolean" ? (value ? "✓" : "—") : (value ?? "—");
                  return (
                    <td key={v.id} className="px-2 py-2 text-charcoal">
                      {shown}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
