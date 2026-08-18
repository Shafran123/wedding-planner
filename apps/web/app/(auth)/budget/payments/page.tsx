"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Plus, Check, Pencil, Trash2 } from "lucide-react";
import type { Payment } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton, Spinner } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { formatMinor, formatDate } from "@/lib/format";
import { PaymentFormDialog } from "@/components/features/payment-form";
import { MoneyDisplay } from "@/components/shared/money-display";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const router = useRouter();
  const { role, wedding } = useWedding();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR<{ payments: Payment[] }>(
    "/api/payments",
    swrFetcher,
  );

  const canFinance = role === "owner" || role === "partner";
  const currency = wedding?.currency ?? "AED";

  const payments = useMemo(() => data?.payments ?? [], [data]);

  const paid = payments.filter((p) => p.status === "paid");
  const upcoming = payments.filter((p) => p.status === "unpaid");
  const overdue = payments.filter((p) => p.status === "overdue");

  const paidTotal = paid.reduce((sum, p) => sum + (p.baseAmountMinor ?? p.amountMinor), 0);
  const upcomingTotal = upcoming.reduce((sum, p) => sum + (p.baseAmountMinor ?? p.amountMinor), 0);
  const overdueTotal = overdue.reduce((sum, p) => sum + (p.baseAmountMinor ?? p.amountMinor), 0);

  const refresh = () =>
    Promise.all([mutate("/api/payments"), mutate("/api/budget"), mutate("/api/dashboard"), mutate("/api/notifications")]);

  const markPaid = async (payment: Payment) => {
    setPayingId(payment.id);
    try {
      await api(`/api/payments/${payment.id}/paid`, { method: "POST" });
      await refresh();
    } finally {
      setPayingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/payments/${deleting.id}`, { method: "DELETE" });
      await refresh();
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const sections = [
    { title: "Overdue", items: overdue, total: overdueTotal, tone: "text-red-700" },
    { title: "Upcoming", items: upcoming, total: upcomingTotal, tone: "text-charcoal" },
    { title: "Completed", items: paid, total: paidTotal, tone: "text-emerald-700" },
  ];

  return (
    <div>
      <button
        onClick={() => router.push("/budget")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-warm hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to budget
      </button>
      <PageHeader
        title="Payments"
        description={`${formatMinor(paidTotal, currency)} paid · ${formatMinor(upcomingTotal, currency)} upcoming · ${formatMinor(overdueTotal, currency)} overdue`}
        action={
          canFinance && (
            <Button variant="gold" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Record payment
            </Button>
          )
        }
      />

      {isLoading && <ListSkeleton rows={5} />}
      {error && <ErrorState onRetry={() => void mutate("/api/payments")} />}

      {data && data.payments.length === 0 && (
        <EmptyState
          title="No payments yet"
          description="Record payments against vendors and expenses, and the budget updates itself."
          actionLabel={canFinance ? "Record payment" : undefined}
          onAction={() => setCreateOpen(true)}
        />
      )}

      {data && (
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-stone-warm">
                  {section.title}
                </span>
                <span className={cn("tabular-nums text-sm font-semibold", section.tone)}>
                  {formatMinor(section.total, currency)}
                </span>
              </h2>
              {section.items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-sand p-4 text-center text-xs text-stone-warm">
                  Nothing here.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-sand bg-white">
                  <ul className="divide-y divide-sand">
                    {section.items.map((payment) => (
                      <li key={payment.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-charcoal">
                            {payment.vendorName ?? payment.expenseName ?? "Payment"}
                            {payment.reference ? ` · ${payment.reference}` : ""}
                          </p>
                          <p className="text-xs text-stone-warm">
                            Due {formatDate(payment.dueDate)}
                            {payment.paymentDate ? ` · paid ${formatDate(payment.paymentDate)}` : ""}
                          </p>
                        </div>
                        <MoneyDisplay
                          minor={payment.amountMinor}
                          record={payment}
                          baseCurrency={currency}
                          className="tabular-nums text-sm font-semibold text-charcoal"
                        />
                        {payment.status !== "paid" && canFinance && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void markPaid(payment)}
                            disabled={payingId === payment.id}
                          >
                            {payingId === payment.id ? <Spinner /> : <Check className="h-3.5 w-3.5" />}
                            Mark paid
                          </Button>
                        )}
                        {canFinance && (
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" aria-label="Edit payment" onClick={() => setEditing(payment)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Delete payment" onClick={() => setDeleting(payment)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <PaymentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          void refresh();
        }}
      />
      {editing && (
        <PaymentFormDialog
          open
          payment={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove payment?"
        description="The payment will be removed and linked expenses recalculated."
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
