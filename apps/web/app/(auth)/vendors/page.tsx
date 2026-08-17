"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Plus, Store } from "lucide-react";
import type { Vendor } from "@wedding/shared";
import { swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty";
import { VendorStatusBadge } from "@/components/shared/badges";
import { formatMinor } from "@/lib/format";
import { VENDOR_CATEGORIES } from "@wedding/shared";
import { VendorFormDialog } from "@/components/features/vendor-form";
import { cn } from "@/lib/utils";

export default function VendorsPage() {
  const { role, wedding } = useWedding();
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const { data, error, isLoading } = useSWR<{ vendors: Vendor[] }>(
    "/api/vendors",
    swrFetcher,
  );

  const canWrite = role !== "viewer";
  const currency = wedding?.currency ?? "AED";

  const vendors = useMemo(() => {
    const list = data?.vendors ?? [];
    return list.filter((v) => {
      if (category && v.category !== category) return false;
      if (status && v.status !== status) return false;
      return true;
    });
  }, [data, category, status]);

  const booked = (data?.vendors ?? []).filter((v) => v.status === "booked").length;
  const open = (data?.vendors ?? []).filter((v) => !["booked", "rejected", "completed"].includes(v.status)).length;

  return (
    <div>
      <PageHeader
        title="Vendors"
        description={
          data ? `${booked} booked · ${open} still open` : undefined
        }
        action={
          canWrite && (
            <Button variant="gold" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New vendor
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-sand bg-white px-3 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-sand bg-white px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="researching">Researching</option>
          <option value="contacted">Contacted</option>
          <option value="meeting">Meeting</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="booked">Booked</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading && <ListSkeleton rows={5} />}
      {error && <ErrorState onRetry={() => void mutate("/api/vendors")} />}

      {data && data.vendors.length === 0 && (
        <EmptyState
          icon={Store}
          title="No vendors yet"
          description="Start adding the professionals who will help make your wedding day special."
          actionLabel={canWrite ? "Add vendor" : undefined}
          onAction={() => setCreateOpen(true)}
        />
      )}

      {data && data.vendors.length > 0 && vendors.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-warm">
          No vendors match your filters.
        </p>
      )}

      {vendors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className={cn(
                "group rounded-2xl border border-sand bg-white p-5 transition-shadow hover:shadow-md",
                vendor.status === "rejected" && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-charcoal group-hover:text-gold">
                    {vendor.name}
                  </p>
                  <p className="text-xs text-stone-warm">{vendor.category}</p>
                </div>
                <VendorStatusBadge status={vendor.status} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="tabular-nums font-semibold text-charcoal">
                  {vendor.priceMinor !== undefined ? formatMinor(vendor.priceMinor, currency) : "—"}
                </span>
                {vendor.rating !== undefined && (
                  <span className="text-xs text-stone-warm">★ {vendor.rating.toFixed(1)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <VendorFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          void Promise.all([mutate("/api/vendors"), mutate("/api/dashboard")]);
        }}
      />
      {editing && (
        <VendorFormDialog
          open
          vendor={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void Promise.all([mutate("/api/vendors"), mutate("/api/dashboard")]);
          }}
        />
      )}
    </div>
  );
}
