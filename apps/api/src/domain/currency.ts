import { ValidationError } from "../errors.js";

export interface NormalizedMoney {
  currency: string;
  rate: number;
  baseMinor: number | null;
}

export interface MoneySpec {
  minor: number | null | undefined;
  currency?: string | null;
  rate?: number | null;
}

/**
 * Converts a raw amount to its stored snapshot: original currency, the rate
 * used (units of base per 1 unit of the item currency), and the converted
 * base amount rounded to whole minor units. Returns null when no amount is
 * present (optional money fields).
 */
export function normalizeMoney(
  spec: MoneySpec,
  baseCurrency: string,
  fallbackRate?: number,
): NormalizedMoney | null {
  if (spec.minor === null || spec.minor === undefined) return null;
  const currency = spec.currency || baseCurrency;
  if (currency === baseCurrency) {
    return { currency, rate: 1, baseMinor: spec.minor };
  }
  const rate = spec.rate ?? fallbackRate;
  if (!rate || rate <= 0) {
    throw new ValidationError(
      `Enter an exchange rate to convert ${currency} to ${baseCurrency}.`,
    );
  }
  return { currency, rate, baseMinor: Math.round(spec.minor * rate) };
}

type RatesSource =
  | Map<string, number>
  | Record<string, number>
  | null
  | undefined;

export function weddingRateFor(
  rates: RatesSource,
  currency: string,
): number | undefined {
  if (!rates) return undefined;
  if (rates instanceof Map) return rates.get(currency);
  return (rates as Record<string, number>)[currency];
}

export function ratesToObject(rates: RatesSource): Record<string, number> {
  if (!rates) return {};
  if (rates instanceof Map) return Object.fromEntries(rates);
  return rates as Record<string, number>;
}
