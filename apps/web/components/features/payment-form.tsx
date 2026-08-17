"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Expense, Payment, Vendor } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { parseToMinor } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { Spinner } from "@/components/ui/empty";
import { PAYMENT_METHODS } from "@wedding/shared";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";

const schema = z.object({
  vendorId: z.string().optional(),
  expenseId: z.string().optional(),
  amountInput: z.string().min(1, "Amount is required."),
  paymentDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required."),
  method: z.string().default("bank_transfer"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

export function PaymentFormDialog({
  open,
  onOpenChange,
  payment,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment;
  onSaved: () => void;
}) {
  const { data: vendorData } = useSWR<{ vendors: Vendor[] }>(
    open ? "/api/vendors" : null,
    swrFetcher,
  );
  const { data: expenseData } = useSWR<{ expenses: Expense[] }>(
    open ? "/api/expenses" : null,
    swrFetcher,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorId: "",
      expenseId: "",
      amountInput: "",
      paymentDate: "",
      dueDate: "",
      method: "bank_transfer",
      reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        vendorId: payment?.vendorId ?? "",
        expenseId: payment?.expenseId ?? "",
        amountInput: payment ? String(payment.amountMinor / 100) : "",
        paymentDate: payment?.paymentDate ? payment.paymentDate.slice(0, 10) : "",
        dueDate: payment?.dueDate ? payment.dueDate.slice(0, 10) : "",
        method: payment?.method ?? "bank_transfer",
        reference: payment?.reference ?? "",
        notes: payment?.notes ?? "",
      });
      setError(null);
    }
  }, [open, payment, reset]);

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      const amountMinor = parseToMinor(values.amountInput);
      if (amountMinor === null) {
        setError("Please enter a valid amount.");
        return;
      }
      const body = {
        vendorId: values.vendorId || undefined,
        expenseId: values.expenseId || undefined,
        amountMinor,
        paymentDate: values.paymentDate || undefined,
        dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString(),
        method: values.method,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
      };
      if (payment) {
        await api(`/api/payments/${payment.id}`, { method: "PATCH", body });
      } else {
        await api("/api/payments", { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save this payment.");
    } finally {
      setBusy(false);
    }
  };

  const vendors = vendorData?.vendors ?? [];
  const expenses = expenseData?.expenses ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payment ? "Edit payment" : "Record payment"}</DialogTitle>
          <DialogDescription>
            Marking a payment paid updates the linked expense automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-vendor">Vendor</Label>
              <Select id="p-vendor" {...register("vendorId")}>
                <option value="">None</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-expense">Expense</Label>
              <Select id="p-expense" {...register("expenseId")}>
                <option value="">None</option>
                {expenses.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-amount">Amount</Label>
              <Input id="p-amount" inputMode="decimal" placeholder="0.00" {...register("amountInput")} />
              <FieldError message={errors.amountInput?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-method">Method</Label>
              <Select id="p-method" {...register("method")}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-due">Due date</Label>
              <Input id="p-due" type="date" {...register("dueDate")} />
              <FieldError message={errors.dueDate?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-paid-date">Paid date</Label>
              <Input id="p-paid-date" type="date" {...register("paymentDate")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-reference">Reference</Label>
            <Input id="p-reference" placeholder="e.g. invoice number" {...register("reference")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-notes">Notes</Label>
            <Textarea id="p-notes" rows={2} {...register("notes")} />
          </div>
          {error && <FieldError message={error} />}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />} {payment ? "Save changes" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
