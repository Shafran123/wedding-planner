import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  className,
  tone = "gold",
}: {
  percent: number;
  className?: string;
  tone?: "gold" | "rose" | "green" | "red";
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color =
    tone === "rose"
      ? "bg-rose"
      : tone === "green"
        ? "bg-emerald-600"
        : tone === "red"
          ? "bg-red-600"
          : "bg-gold";
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-sand/80", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
