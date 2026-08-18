"use client";

import { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Vendor } from "@wedding/shared";
import { api } from "@/lib/api";
import { parseToMinor } from "@/lib/money";
import { MoneyInput } from "@/components/shared/money-input";
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
import { VENDOR_CATEGORIES, VENDOR_STATUSES } from "@wedding/shared";
import { VENDOR_STATUS_LABELS } from "@/lib/labels";

const schema = z.object({
  name: z.string().min(1, "Vendor name is required.").max(200),
  category: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  website: z.string().url("Enter a valid URL (with https://).").optional().or(z.literal("")),
  instagram: z.string().optional(),
  address: z.string().optional(),
  priceInput: z.string().optional(),
  currency: z.string().optional(),
  rate: z.string().optional(),
  status: z.string().default("researching"),
  rating: z.string().optional(),
  meetingDate: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor;
  onSaved: () => void;
}) {
  const { wedding } = useWedding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseCurrency = wedding?.currency ?? "AED";
  const fallbackRate = wedding?.rates?.["LKR"];

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
      category: VENDOR_CATEGORIES[0],
      contactName: "",
      phone: "",
      email: "",
      website: "",
      instagram: "",
      address: "",
      priceInput: "",
      currency: "AED",
      rate: "",
      status: "researching",
      rating: "",
      meetingDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: vendor?.name ?? "",
        category: vendor?.category ?? VENDOR_CATEGORIES[0],
        contactName: vendor?.contactName ?? "",
        phone: vendor?.phone ?? "",
        email: vendor?.email ?? "",
        website: vendor?.website ?? "",
        instagram: vendor?.instagram ?? "",
        address: vendor?.address ?? "",
        priceInput: vendor?.priceMinor !== undefined ? String(vendor.priceMinor / 100) : "",
        currency: vendor?.currency ?? baseCurrency,
        rate:
          vendor && vendor.currency && vendor.currency !== baseCurrency
            ? String(vendor.rate ?? "")
            : "",
        status: vendor?.status ?? "researching",
        rating: vendor?.rating !== undefined ? String(vendor.rating) : "",
        meetingDate: vendor?.meetingDate ? vendor.meetingDate.slice(0, 10) : "",
        notes: vendor?.notes ?? "",
      });
      setError(null);
    }
  }, [open, vendor, reset, baseCurrency]);

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      const currency = values.currency || baseCurrency;
      const rate = currency !== baseCurrency ? Number(values.rate) : undefined;
      if (values.priceInput && currency !== baseCurrency && (rate === undefined || !Number.isFinite(rate) || rate <= 0)) {
        setError(`Enter an exchange rate to convert ${currency} to ${baseCurrency}.`);
        return;
      }
      const body = {
        name: values.name,
        category: values.category,
        contactName: values.contactName || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        website: values.website || undefined,
        instagram: values.instagram || undefined,
        address: values.address || undefined,
        priceMinor: values.priceInput ? (parseToMinor(values.priceInput) ?? undefined) : undefined,
        currency,
        rate: rate ?? undefined,
        status: values.status,
        rating: values.rating ? Number(values.rating) : undefined,
        meetingDate: values.meetingDate || undefined,
        notes: values.notes || undefined,
      };
      if (vendor) {
        await api(`/api/vendors/${vendor.id}`, { method: "PATCH", body });
      } else {
        await api("/api/vendors", { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save this vendor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit vendor" : "New vendor"}</DialogTitle>
          <DialogDescription>Keep every professional's details in one place.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="v-name">Name</Label>
              <Input id="v-name" autoFocus {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-category">Category</Label>
              <Select id="v-category" {...register("category")}>
                {VENDOR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-contact">Contact person</Label>
              <Input id="v-contact" {...register("contactName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-phone">Phone</Label>
              <Input id="v-phone" type="tel" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-email">Email</Label>
              <Input id="v-email" type="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-instagram">Instagram handle</Label>
              <Input id="v-instagram" placeholder="@studio" {...register("instagram")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-website">Website</Label>
              <Input id="v-website" placeholder="https://…" {...register("website")} />
              <FieldError message={errors.website?.message} />
            </div>
            <MoneyInput
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              amountField="priceInput"
              amountId="v-price"
              label="Price"
              baseCurrency={baseCurrency}
              fallbackRate={fallbackRate}
            />
            <div className="space-y-1.5">
              <Label htmlFor="v-status">Status</Label>
              <Select id="v-status" {...register("status")}>
                {VENDOR_STATUSES.map((s) => (
                  <option key={s} value={s}>{VENDOR_STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-rating">Rating (0–5)</Label>
              <Input id="v-rating" inputMode="decimal" placeholder="4.5" {...register("rating")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-meeting">Meeting date</Label>
              <Input id="v-meeting" type="date" {...register("meetingDate")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-address">Address</Label>
            <Input id="v-address" {...register("address")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-notes">Notes</Label>
            <Textarea id="v-notes" rows={2} {...register("notes")} />
          </div>
          {error && <FieldError message={error} />}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />} {vendor ? "Save changes" : "Add vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
