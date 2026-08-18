import { format, formatDistanceToNow, isSameDay, isToday, isTomorrow } from "date-fns";

export function formatMinor(minor: number | undefined | null, currency = "AED"): string {
  if (minor === undefined || minor === null) return "—";
  const major = minor / 100;
  const fractionDigits = minor % 100 === 0 ? 0 : 2;
  if (currency === "LKR") {
    return `Rs ${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: fractionDigits,
    }).format(major)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
  }).format(major);
}

export function formatMinorPlain(minor: number): string {
  const major = minor / 100;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(major);
}

export interface MoneyRecordLike {
  currency?: string | null;
  baseMinor?: number | null;
}

/**
 * Formats an amount in its stored currency with the base-currency equivalent
 * as an optional secondary string. Returns primary in the record's currency
 * (or the base when the record has none), secondary only when they differ.
 */
export function formatMoneyPair(
  minor: number | null | undefined,
  record: MoneyRecordLike | null | undefined,
  baseCurrency: string,
): { primary: string; secondary: string | null } {
  const currency = record?.currency || baseCurrency;
  const primary = formatMinor(minor, currency);
  if (currency === baseCurrency) return { primary, secondary: null };
  const base = record?.baseMinor ?? minor;
  if (base === null || base === undefined) return { primary, secondary: null };
  return { primary, secondary: `≈ ${formatMinor(base, baseCurrency)}` };
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM yyyy");
}

export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM yyyy, HH:mm");
}

export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, d MMM");
}

export function relativeDue(iso: string | undefined | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  if (date.getTime() < now.getTime() && !isSameDay(date, now)) {
    return `${formatDistanceToNow(date)} overdue`;
  }
  if (isToday(date)) return "Due today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "d MMM");
}

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
