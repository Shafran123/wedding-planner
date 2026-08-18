"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Plus, Pencil, Trash2, FileImage } from "lucide-react";
import type { Expense } from "@wedding/shared";

import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader } from "@/components/shared/page";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PaymentStatusBadge } from "@/components/shared/badges";
import { formatMinor, formatDate } from "@/lib/format";
import { ExpenseFormDialog } from "@/components/features/expense-form";
import { MoneyDisplay } from "@/components/shared/money-display";

export default function ExpensesPage() {
  const router = useRouter();
  const { role, wedding } = useWedding();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ expenses: Expense[] }>(
    "/api/expenses",
    swrFetcher,
  );

  const canFinance = role === "owner" || role === "partner";
  const currency = wedding?.currency ?? "AED";
  const expenses = useMemo(() => data?.expenses ?? [], [data]);
  const committed = expenses
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + (e.baseEstimatedMinor ?? e.estimatedMinor), 0);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/expenses/${deleting.id}`, { method: "DELETE" });
      await Promise.all([mutate("/api/expenses"), mutate("/api/budget"), mutate("/api/dashboard")]);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push("/budget")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-warm hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to budget
      </button>
      <PageHeader
        title="Expenses"
        description={`${formatMinor(committed, currency)} committed across ${expenses.filter((e) => e.status === "active").length} expenses`}
        action={
          canFinance && (
            <Button variant="gold" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New expense
            </Button>
          )
        }
      />

      {isLoading && <ListSkeleton rows={5} />}
      {error && <ErrorState onRetry={() => void mutate("/api/expenses")} />}

      {data && data.expenses.length === 0 && (
        <EmptyState
          title="No expenses yet"
          description="Add planned costs — venue, catering, photography — to start tracking your budget."
          actionLabel={canFinance ? "Add expense" : undefined}
          onAction={() => setCreateOpen(true)}
        />
      )}

      {data && data.expenses.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-sand bg-white">
          <ul className="divide-y divide-sand">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-charcoal">{expense.name}</p>
                    {expense.receiptUrl && (
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Receipt for ${expense.name}`}
                        className="text-stone-warm hover:text-gold"
                      >
                        <FileImage className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="truncate text-xs text-stone-warm">
                    {expense.categoryName ?? "Uncategorised"}
                    {expense.vendorName ? ` · ${expense.vendorName}` : ""}
                    {expense.dueDate ? ` · due ${formatDate(expense.dueDate)}` : ""}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <MoneyDisplay
                    minor={expense.actualMinor ?? expense.estimatedMinor}
                    record={expense}
                    baseCurrency={currency}
                    className="tabular-nums text-sm font-semibold text-charcoal"
                  />
                  {expense.actualMinor !== undefined && (
                    <p className="text-xs text-stone-warm">
                      est.{" "}
                      <MoneyDisplay
                        minor={expense.estimatedMinor}
                        record={expense}
                        baseCurrency={currency}
                        inline
                        className="font-medium"
                      />
                    </p>
                  )}
                </div>
                <PaymentStatusBadge status={expense.paymentStatus} />
                {canFinance && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${expense.name}`} onClick={() => setEditing(expense)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${expense.name}`} onClick={() => setDeleting(expense)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ExpenseFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          void Promise.all([mutate("/api/expenses"), mutate("/api/budget"), mutate("/api/dashboard")]);
        }}
      />
      {editing && (
        <ExpenseFormDialog
          open
          expense={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void Promise.all([mutate("/api/expenses"), mutate("/api/budget"), mutate("/api/dashboard")]);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove expense?"
        description={`"${deleting?.name}" will be removed from your budget (soft-deleted, kept for records).`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
