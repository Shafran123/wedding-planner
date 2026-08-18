import { formatMoneyPair } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MoneyDisplay({
  minor,
  record,
  baseCurrency,
  className,
  secondaryClassName,
  inline = false,
}: {
  minor: number | null | undefined;
  record?: { currency?: string | null; baseMinor?: number | null } | null;
  baseCurrency: string;
  className?: string;
  secondaryClassName?: string;
  inline?: boolean;
}) {
  const { primary, secondary } = formatMoneyPair(minor, record, baseCurrency);
  if (!secondary) {
    return <span className={className}>{primary}</span>;
  }
  return (
    <span className={cn(!inline && "flex flex-col items-end", "leading-tight")}>
      <span className={className}>{primary}</span>
      <span className={cn("text-[11px] text-stone-warm", secondaryClassName)}>
        {secondary}
      </span>
    </span>
  );
}
