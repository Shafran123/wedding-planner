"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Pencil, Trash2, Navigation, MapPin } from "lucide-react";
import type { Location } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader, ErrorState } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LocationFormDialog } from "@/components/features/location-form";
import { LocationStatusBadge } from "@/components/shared/badges";
import { LOCATION_TYPE_LABELS } from "@/lib/labels";
import { formatMinor } from "@/lib/format";

function mapsUrl(location: Location): string | undefined {
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  if (location.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
  }
  return undefined;
}

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, wedding } = useWedding();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ location: Location }>(
    `/api/locations/${id}`,
    swrFetcher,
  );

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return <ErrorState message="We couldn't find that location." onRetry={() => router.push("/locations")} />;
  }

  const location = data.location;
  const canWrite = role === "owner" || role === "partner";
  const currency = wedding?.currency ?? "AED";
  const openInMaps = mapsUrl(location);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api(`/api/locations/${location.id}`, { method: "DELETE" });
      await mutate("/api/locations");
      router.push("/locations");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/locations")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-warm hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to locations
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{location.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <LocationStatusBadge status={location.status} />
            <span className="text-xs text-stone-warm">{LOCATION_TYPE_LABELS[location.type]}</span>
            {location.selectedVenue && (
              <span className="text-xs font-semibold text-gold">★ Selected venue</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {openInMaps && (
            <a href={openInMaps} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <Navigation className="h-3.5 w-3.5" /> Get directions
              </Button>
            </a>
          )}
          {canWrite && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(true)}>
                <Trash2 className="h-3.5 w-3.5 text-red-700" />
              </Button>
            </>
          )}
        </div>
      </div>

      {location.images.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {location.images.slice(0, 6).map((url, i) => (
            <div key={i} className="relative h-36 w-full overflow-hidden rounded-xl">
              <Image
                src={url}
                alt={`${location.name} photo ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {location.address && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-stone-warm"><MapPin className="h-3.5 w-3.5" /> Address</dt>
                  <dd className="text-right text-charcoal">{location.address}</dd>
                </div>
              )}
              {location.capacity !== undefined && (
                <div className="flex justify-between"><dt className="text-stone-warm">Capacity</dt><dd className="text-charcoal">{location.capacity} guests</dd></div>
              )}
              {location.estimatedCostMinor !== undefined && (
                <div className="flex justify-between"><dt className="text-stone-warm">Estimated cost</dt><dd className="font-semibold text-charcoal">{formatMinor(location.estimatedCostMinor, currency)}</dd></div>
              )}
              {location.contactName && (
                <div className="flex justify-between"><dt className="text-stone-warm">Contact</dt><dd className="text-charcoal">{location.contactName}{location.contactPhone ? ` · ${location.contactPhone}` : ""}</dd></div>
              )}
              {location.website && (
                <div className="flex justify-between"><dt className="text-stone-warm">Website</dt><dd><a href={location.website} target="_blank" rel="noreferrer" className="text-gold hover:underline">Open</a></dd></div>
              )}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            {location.notes ? (
              <p className="whitespace-pre-wrap text-sm text-charcoal">{location.notes}</p>
            ) : (
              <p className="text-sm text-stone-warm">No notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <LocationFormDialog
        open={editing}
        location={location}
        onOpenChange={setEditing}
        onSaved={() => {
          setEditing(false);
          void Promise.all([mutate(`/api/locations/${location.id}`), mutate("/api/locations")]);
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Remove location?"
        description={`"${location.name}" will be removed.`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
