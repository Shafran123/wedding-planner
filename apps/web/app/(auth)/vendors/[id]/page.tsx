"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MessageCircle,
  Globe,
} from "lucide-react";
import type { Payment, Task, Vendor } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader, ErrorState } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VendorFormDialog } from "@/components/features/vendor-form";
import { VendorStatusBadge } from "@/components/shared/badges";
import { formatMinor, formatDate } from "@/lib/format";

function instagramUrl(handle: string | undefined): string | undefined {
  if (!handle) return undefined;
  const clean = handle.replace(/^@/, "");
  return `https://instagram.com/${clean}`;
}

function whatsappUrl(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${digits}`;
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, wedding } = useWedding();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ vendor: Vendor }>(
    `/api/vendors/${id}`,
    swrFetcher,
  );
  const { data: paymentData } = useSWR<{ payments: Payment[] }>(
    `/api/payments?vendorId=${id}`,
    swrFetcher,
  );
  const { data: taskData } = useSWR<{ tasks: Task[] }>("/api/tasks", swrFetcher);

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return <ErrorState message="We couldn't find that vendor." onRetry={() => router.push("/vendors")} />;
  }

  const vendor = data.vendor;
  const canWrite = role !== "viewer";
  const currency = wedding?.currency ?? "AED";
  const payments = paymentData?.payments ?? [];
  const tasks = (taskData?.tasks ?? []).filter((t) => t.vendorId === vendor.id);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api(`/api/vendors/${vendor.id}`, { method: "DELETE" });
      await mutate("/api/vendors");
      router.push("/vendors");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/vendors")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-warm hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{vendor.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <VendorStatusBadge status={vendor.status} />
            <span className="text-xs text-stone-warm">{vendor.category}</span>
            {vendor.rating !== undefined && (
              <span className="text-xs text-stone-warm">★ {vendor.rating.toFixed(1)}</span>
            )}
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

      {(vendor.phone || vendor.email || vendor.website || vendor.instagram) && (
        <div className="mb-5 flex flex-wrap gap-2">
          {vendor.phone && (
            <a href={`tel:${vendor.phone}`}>
              <Button variant="outline" size="sm"><Phone className="h-3.5 w-3.5" /> Call</Button>
            </a>
          )}
          {vendor.phone && (
            <a href={whatsappUrl(vendor.phone)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</Button>
            </a>
          )}
          {vendor.email && (
            <a href={`mailto:${vendor.email}`}>
              <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5" /> Email</Button>
            </a>
          )}
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><Globe className="h-3.5 w-3.5" /> Website</Button>
            </a>
          )}
          {vendor.instagram && (
            <a href={instagramUrl(vendor.instagram)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                Instagram
              </Button>
            </a>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {vendor.contactName && (
                <div className="flex justify-between"><dt className="text-stone-warm">Contact</dt><dd className="text-charcoal">{vendor.contactName}</dd></div>
              )}
              {vendor.priceMinor !== undefined && (
                <div className="flex justify-between"><dt className="text-stone-warm">Price</dt><dd className="font-semibold text-charcoal">{formatMinor(vendor.priceMinor, currency)}</dd></div>
              )}
              {vendor.address && (
                <div className="flex justify-between"><dt className="text-stone-warm">Address</dt><dd className="text-right text-charcoal">{vendor.address}</dd></div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            {vendor.notes ? (
              <p className="whitespace-pre-wrap text-sm text-charcoal">{vendor.notes}</p>
            ) : (
              <p className="text-sm text-stone-warm">No notes yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-stone-warm">No payments recorded for this vendor.</p>
            ) : (
              <ul className="divide-y divide-sand">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-charcoal">Due {formatDate(p.dueDate)}</span>
                    <span className="tabular-nums font-medium text-charcoal">
                      {formatMinor(p.amountMinor, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Related tasks</CardTitle></CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-stone-warm">No tasks linked to this vendor.</p>
            ) : (
              <ul className="divide-y divide-sand">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <a href={`/tasks/${t.id}`} className="block py-2 text-sm text-charcoal hover:text-gold">
                      {t.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <VendorFormDialog
        open={editing}
        vendor={vendor}
        onOpenChange={setEditing}
        onSaved={() => {
          setEditing(false);
          void Promise.all([mutate(`/api/vendors/${vendor.id}`), mutate("/api/vendors")]);
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Remove vendor?"
        description={`"${vendor.name}" will be hidden (kept for records).`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
