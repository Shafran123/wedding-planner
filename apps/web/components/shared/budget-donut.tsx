"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CategorySpend } from "@wedding/shared";

const COLORS = ["#b3924e", "#c98a8a", "#8a9a8a", "#7d8fa3", "#b3946e", "#9d8bb3", "#6ea3a3", "#c9a86a"];

export function BudgetDonut({
  data,
  currency,
  totalLabel = "Planned",
}: {
  data: CategorySpend[];
  currency: string;
  totalLabel?: string;
}) {
  const rows = data.filter((c) => c.plannedMinor > 0);
  const total = rows.reduce((sum, c) => sum + c.plannedMinor, 0);

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-stone-warm">
        Allocate planned amounts per category to see the breakdown.
      </p>
    );
  }

  const chartData = rows.map((c) => ({ name: c.name, value: c.plannedMinor }));

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full space-y-2">
        {rows.slice(0, 7).map((c, i) => (
          <div key={c.categoryId} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-charcoal">{c.name}</span>
            <span className="tabular-nums text-stone-warm">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              }).format(c.plannedMinor / 100)}
            </span>
          </div>
        ))}
        <div className="border-t border-sand pt-2 text-sm font-semibold text-charcoal">
          {totalLabel}:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          }).format(total / 100)}
        </div>
      </div>
    </div>
  );
}
