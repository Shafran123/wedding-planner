"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Pencil, Receipt, CreditCard, Check } from "lucide-react";
import type { BudgetCategory, BudgetTotals, CategorySpend } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader, StatCard } from "@/components/shared/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, FieldError } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { PageLoader, ErrorState } from "@/components/ui/empty";
import { ProgressBar } from "@/components/shared/progress-bar";
import { BudgetDonut } from "@/components/shared/budget-donut";
import { formatMinor } from "@/lib/format";
import { parseToMinor } from "@/lib/money";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BudgetData {
  budget: BudgetTotals;
  categories: BudgetCategory[];
  categorySpend: CategorySpend[];
}

export default function BudgetPage() {
  const { role, wedding } = useWedding();
  const [view, setView] = useState("overview");
  const { data, error, isLoading } = useSWR<BudgetData>(
    "/api/budget",
    swrFetcher,
  );

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState onRetry={() => void mutate("/api/budget")} />;

  const currency = wedding?.currency ?? "AED";
  const canFinance = role === "owner" || role === "partner";
  const topAlert = data.budget.alerts.at(-1)?.level;
  const tone = topAlert === "exceeded" ? "red" : topAlert === "critical" ? "red" : topAlert === "warning" ? "amber" : "gold";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        description="Track every dirham and know exactly where you stand."
        action={
          canFinance && (
            <div className="flex gap-2">
              <Link href="/budget/expenses">
                <Button variant="outline"><Receipt className="h-4 w-4" /> Expenses</Button>
              </Link>
              <Link href="/budget/payments">
                <Button variant="outline"><CreditCard className="h-4 w-4" /> Payments</Button>
              </Link>
            </div>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total budget" value={formatMinor(data.budget.totalBudgetMinor, currency)} accent="gold" />
        <StatCard label="Planned" value={formatMinor(data.budget.plannedMinor, currency)} sub="allocated to categories" accent="blue" />
        <StatCard label="Committed" value={formatMinor(data.budget.committedMinor, currency)} sub="estimated expenses" accent="rose" />
        <StatCard
          label="Remaining"
          value={formatMinor(data.budget.remainingMinor, currency)}
          sub={`${formatMinor(data.budget.paidMinor, currency)} paid`}
          accent={data.budget.remainingMinor < 0 ? "red" : "green"}
        />
      </div>

      <div className="rounded-2xl border border-sand bg-white p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-charcoal">Budget used</span>
          <span className="tabular-nums text-stone-warm">
            {Math.round(data.budget.percentUsed)}%
          </span>
        </div>
        <ProgressBar percent={data.budget.percentUsed} tone={tone as never} className="h-3" />
      </div>

      {data.budget.alerts.length > 0 && (
        <div className="space-y-2">
          {data.budget.alerts.map((a, i) => (
            <Alert key={i} variant={a.level === "exceeded" ? "critical" : a.level === "critical" ? "critical" : "warning"}>
              <AlertTitle>{a.message}</AlertTitle>
            </Alert>
          ))}
        </div>
      )}

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories & allocation</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Planned breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetDonut data={data.categorySpend} currency={currency} />
          </CardContent>
        </Card>
      )}

      {view === "categories" && (
        <Card>
          <CardHeader>
            <CardTitle>Category allocations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.categories.map((category) => {
              const spend = data.categorySpend.find((c) => c.categoryId === category.id);
              return (
                <AllocationRow
                  key={category.id}
                  category={category}
                  spentMinor={spend?.spentMinor ?? 0}
                  currency={currency}
                  canEdit={canFinance}
                />
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AllocationRow({
  category,
  spentMinor,
  currency,
  canEdit,
}: {
  category: BudgetCategory;
  spentMinor: number;
  currency: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const over = category.plannedMinor > 0 && spentMinor > category.plannedMinor;

  const save = async () => {
    const minor = parseToMinor(value);
    if (minor === null) {
      setError("Please enter a valid amount.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/api/budget/categories/${category.id}`, {
        method: "PUT",
        body: { plannedMinor: minor },
      });
      await mutate("/api/budget");
      await mutate("/api/dashboard");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't update this.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-sand p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-charcoal">{category.name}</p>
          <p className="text-xs text-stone-warm">
            {over ? (
              <span className="font-medium text-red-700">
                Over budget by {formatMinor(spentMinor - category.plannedMinor, currency)}
              </span>
            ) : (
              <>Spent {formatMinor(spentMinor, currency)}</>
            )}
          </p>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32"
              aria-label={`Planned amount for ${category.name}`}
            />
            <Button size="sm" variant="gold" onClick={() => void save()} disabled={busy}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="tabular-nums text-sm font-semibold text-charcoal">
              {formatMinor(category.plannedMinor, currency)}
            </span>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit allocation for ${category.name}`}
                onClick={() => {
                  setValue(String(category.plannedMinor / 100));
                  setEditing(true);
                  setError(null);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
      {error && <FieldError message={error} />}
      {category.plannedMinor > 0 && (
        <ProgressBar
          percent={(spentMinor / category.plannedMinor) * 100}
          tone={over ? "red" : "gold"}
          className="mt-2"
        />
      )}
    </div>
  );
}
