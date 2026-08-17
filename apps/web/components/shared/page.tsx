import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "gold",
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "gold" | "rose" | "green" | "red" | "blue";
  onClick?: () => void;
}) {
  const iconColor =
    accent === "rose"
      ? "bg-blush text-rose"
      : accent === "green"
        ? "bg-emerald-50 text-emerald-700"
        : accent === "red"
          ? "bg-red-50 text-red-700"
          : accent === "blue"
            ? "bg-sky-50 text-sky-700"
            : "bg-gold-soft/50 text-gold";
  return (
    <Card
      className={cn("p-5 transition-shadow", onClick && "cursor-pointer hover:shadow-md")}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm">
            {label}
          </p>
          <div className="mt-2 text-xl font-bold tracking-tight text-charcoal tabular-nums">
            {value}
          </div>
          {sub && <p className="mt-1 text-xs text-stone-warm">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn("rounded-xl p-2.5", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-charcoal md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-stone-warm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
