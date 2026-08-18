"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { BudgetCategory, Expense, Vendor } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { parseToMinor } from "@/lib/money";
import { MoneyInput } from "@/components/shared/money-input";
import { getClientStorage, ref, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { useWedding } from "@/contexts/wedding";
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

const schema = z.object({
  name: z.string().min(1, "Expense name is required.").max(200),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  estimatedInput: z.string().min(1, "Estimated amount is required."),
  actualInput: z.string().optional(),
  currency: z.string().optional(),
  rate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
  onSaved: () => void;
}) {
  const { wedding } = useWedding();
  const { data: categoryData } = useSWR<{ categories: BudgetCategory[] }>(
    open ? "/api/budget" : null,
    swrFetcher,
  );
  const { data: vendorData } = useSWR<{ vendors: Vendor[] }>(
    open ? "/api/vendors" : null,
    swrFetcher,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      vendorId: "",
      estimatedInput: "",
      actualInput: "",
      currency: "AED",
      rate: "",
      dueDate: "",
      notes: "",
    },
  });

  const baseCurrency = wedding?.currency ?? "AED";
  const fallbackRate = wedding?.rates?.["LKR"];

  useEffect(() => {
    if (open) {
      reset({
        name: expense?.name ?? "",
        description: expense?.description ?? "",
        categoryId: expense?.categoryId ?? "",
        vendorId: expense?.vendorId ?? "",
        estimatedInput: expense ? String(expense.estimatedMinor / 100) : "",
        actualInput: expense?.actualMinor !== undefined ? String(expense.actualMinor / 100) : "",
        currency: expense?.currency ?? baseCurrency,
        rate:
          expense && expense.currency && expense.currency !== baseCurrency
            ? String(expense.rate ?? "")
            : "",
        dueDate: expense?.dueDate ? expense.dueDate.slice(0, 10) : "",
        notes: expense?.notes ?? "",
      });
      setReceiptFile(null);
      setError(null);
    }
  }, [open, expense, reset, baseCurrency]);

  const uploadReceipt = async (weddingId: string): Promise<string | undefined> => {
    if (!receiptFile) return undefined;
    const storage = getClientStorage();
    if (!storage) {
      setError("File storage isn't configured (Firebase).");
      return undefined;
    }
    setUploading(true);
    try {
      const ext = receiptFile.name.split(".").pop() ?? "jpg";
      const path = `weddings/${weddingId}/receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, receiptFile);
      return await getDownloadURL(fileRef);
    } catch {
      setError("We couldn't upload the receipt.");
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      const estimatedMinor = parseToMinor(values.estimatedInput);
      const actualMinor = values.actualInput ? parseToMinor(values.actualInput) : undefined;
      if (estimatedMinor === null) {
        setError("Please enter a valid amount.");
        return;
      }
      const currency = values.currency || baseCurrency;
      const rate =
        currency !== baseCurrency ? Number(values.rate) : undefined;
      if (
        currency !== baseCurrency &&
        (rate === undefined || !Number.isFinite(rate) || rate <= 0)
      ) {
        setError(`Enter an exchange rate to convert ${currency} to ${baseCurrency}.`);
        return;
      }
      const body: Record<string, unknown> = {
        name: values.name,
        description: values.description || undefined,
        categoryId: values.categoryId || undefined,
        vendorId: values.vendorId || undefined,
        estimatedMinor,
        actualMinor: actualMinor ?? undefined,
        currency,
        rate: rate ?? undefined,
        dueDate: values.dueDate || undefined,
        notes: values.notes || undefined,
      };
      if (wedding?.id) {
        const receiptUrl = await uploadReceipt(wedding.id);
        if (receiptUrl) body.receiptUrl = receiptUrl;
      }
      if (expense) {
        await api(`/api/expenses/${expense.id}`, { method: "PATCH", body });
      } else {
        await api("/api/expenses", { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save this expense.");
    } finally {
      setBusy(false);
    }
  };

  const categories = categoryData?.categories ?? [];
  const vendors = vendorData?.vendors ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "New expense"}</DialogTitle>
          <DialogDescription>Amounts are stored in integer minor units — no rounding surprises.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="e-name">Name</Label>
            <Input id="e-name" autoFocus {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MoneyInput
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              amountField="estimatedInput"
              amountId="e-estimated"
              label="Estimated amount"
              baseCurrency={baseCurrency}
              fallbackRate={fallbackRate}
            />
            <MoneyInput
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              amountField="actualInput"
              amountId="e-actual"
              label="Actual amount"
              baseCurrency={baseCurrency}
              fallbackRate={fallbackRate}
              primary={false}
            />
            <div className="space-y-1.5">
              <Label htmlFor="e-category">Category</Label>
              <Select id="e-category" {...register("categoryId")}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-vendor">Vendor</Label>
              <Select id="e-vendor" {...register("vendorId")}>
                <option value="">None</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-due">Due date</Label>
              <Input id="e-due" type="date" {...register("dueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-receipt">Receipt image</Label>
              <Input
                id="e-receipt"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-notes">Notes</Label>
            <Textarea id="e-notes" rows={2} {...register("notes")} />
          </div>
          {error && <FieldError message={error} />}
          <DialogFooter>
            <Button type="submit" disabled={busy || uploading}>
              {(busy || uploading) && <Spinner />}
              {expense ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
