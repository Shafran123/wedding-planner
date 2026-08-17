/**
 * Convert a user-typed decimal string (e.g. "1500.50") to integer minor units
 * without floating-point arithmetic.
 */
export function parseToMinor(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (trimmed.length === 0) return null;
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").padEnd(2, "0");
  return Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction || "0", 10);
}

export function toInputValue(minor: number | undefined | null): string {
  if (minor === undefined || minor === null) return "";
  return (minor / 100).toFixed(minor % 100 === 0 ? 0 : 2);
}
