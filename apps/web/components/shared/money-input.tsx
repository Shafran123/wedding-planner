"use client";

import { useEffect, useRef } from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { CURRENCIES } from "@wedding/shared";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { formatMinor } from "@/lib/format";
import { parseToMinor } from "@/lib/money";

export function MoneyInput<T extends FieldValues & { currency?: string; rate?: string }>({
  register,
  watch,
  setValue,
  errors,
  amountField,
  amountId,
  label,
  baseCurrency,
  fallbackRate,
  primary = true,
}: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  amountField: Path<T>;
  amountId: string;
  label: string;
  baseCurrency: string;
  fallbackRate?: number;
  primary?: boolean;
}) {
  const currency = String(watch("currency" as Path<T>) ?? baseCurrency);
  const rate = String(watch("rate" as Path<T>) ?? "");
  const amount = String(watch(amountField) ?? "");
  const prevCurrency = useRef(currency);

  useEffect(() => {
    if (prevCurrency.current === currency) return;
    prevCurrency.current = currency;
    if (currency !== baseCurrency) {
      setValue(
        "rate" as Path<T>,
        (fallbackRate !== undefined && fallbackRate > 0 ? String(fallbackRate) : "") as PathValue<T, Path<T>>,
      );
    }
  }, [currency, baseCurrency, fallbackRate, setValue]);

  const amountMinor = parseToMinor(amount);
  const rateNum = Number(rate);
  const previewMinor =
    currency !== baseCurrency &&
    amountMinor !== null &&
    Number.isFinite(rateNum) &&
    rateNum > 0
      ? Math.round(amountMinor * rateNum)
      : null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={amountId}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={amountId}
          inputMode="decimal"
          placeholder="0.00"
          className="flex-1"
          {...register(amountField)}
        />
        {primary && (
          <Select className="w-24 shrink-0" {...register("currency" as Path<T>)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </Select>
        )}
      </div>
      <FieldError message={errors[amountField]?.message as string | undefined} />
      {primary && currency !== baseCurrency && (
        <div className="space-y-1.5">
          <Label htmlFor={`${amountId}-rate`}>
            Rate: 1 {currency} = ? {baseCurrency}
          </Label>
          <Input
            id={`${amountId}-rate`}
            inputMode="decimal"
            placeholder="0.0000"
            {...register("rate" as Path<T>)}
          />
        </div>
      )}
      {previewMinor !== null && (
        <p className="text-xs text-stone-warm">≈ {formatMinor(previewMinor, baseCurrency)}</p>
      )}
    </div>
  );
}
