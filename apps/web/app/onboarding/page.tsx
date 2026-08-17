"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { api } from "@/lib/api";
import { parseToMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { Spinner } from "@/components/ui/empty";
import { CURRENCIES, WEDDING_TYPES } from "@wedding/shared";

const schema = z.object({
  weddingName: z.string().min(2, "Give your wedding a name, e.g. “Sarah & Ahmed”").max(120),
  partnerOneName: z.string().min(1, "Partner one's name is required.").max(80),
  partnerTwoName: z.string().max(80).optional(),
  weddingDate: z.string().min(1, "Please choose your wedding date."),
  location: z.string().max(200).optional(),
  currency: z.string().length(3),
  estimatedGuestCount: z.string().optional(),
  totalBudget: z.string().optional(),
  weddingType: z.string().optional(),
  planningStage: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

const STEPS = [
  { title: "Your wedding", subtitle: "Give your wedding a name and tell us who's getting married." },
  { title: "The big day", subtitle: "When and where will it happen?" },
  { title: "Money & guests", subtitle: "A rough budget and guest count is enough for now." },
  { title: "Style", subtitle: "Help us tailor your planning experience." },
] as const;

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      weddingName: "",
      partnerOneName: user?.displayName ?? "",
      partnerTwoName: "",
      weddingDate: "",
      location: "",
      currency: "AED",
      estimatedGuestCount: "",
      totalBudget: "",
      weddingType: "",
      planningStage: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const submit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/onboarding", {
        method: "POST",
        body: {
          weddingName: values.weddingName,
          partnerOneName: values.partnerOneName,
          partnerTwoName: values.partnerTwoName || undefined,
          weddingDate: new Date(`${values.weddingDate}T12:00:00`).toISOString(),
          location: values.location || undefined,
          currency: values.currency,
          estimatedGuestCount: values.estimatedGuestCount
            ? Number.parseInt(values.estimatedGuestCount, 10)
            : undefined,
          totalBudgetMinor: values.totalBudget ? (parseToMinor(values.totalBudget) ?? 0) : 0,
          weddingType: values.weddingType || undefined,
          planningStage: values.planningStage || undefined,
          timezone: "Asia/Dubai",
        },
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't create your wedding. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    const valid = await methods.trigger(fieldsForStep(step) as (keyof FormValues)[]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const fieldsForStep = (s: number): (keyof FormValues)[] => {
    switch (s) {
      case 0:
        return ["weddingName", "partnerOneName", "partnerTwoName"];
      case 1:
        return ["weddingDate"];
      default:
        return [];
    }
  };

  const onSubmit = methods.handleSubmit(submit);

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold text-charcoal">
            Wedding Planner
          </span>
        </div>

        <div className="mb-6 flex gap-2" aria-hidden>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gold" : "bg-sand"}`}
            />
          ))}
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
          {STEPS[step].title}
        </h1>
        <p className="mt-1.5 text-sm text-stone-warm">{STEPS[step].subtitle}</p>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            {step === 0 && <StepNames />}
            {step === 1 && <StepDate />}
            {step === 2 && <StepMoney />}
            {step === 3 && <StepStyle />}

            {error && (
              <p role="alert" className="text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || busy}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                {step < STEPS.length - 1 && (
                  <>
                    <Button variant="ghost" type="button" onClick={() => setStep(step + 1)} disabled={busy}>
                      Skip
                    </Button>
                    <Button type="button" variant="gold" onClick={() => void next()}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {step === STEPS.length - 1 && (
                  <Button type="submit" variant="gold" disabled={busy}>
                    {busy && <Spinner />} Create my wedding
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

function StepNames() {
  const { register, formState: { errors } } = useFormContext<FormValues>();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="weddingName">Wedding name</Label>
        <Input id="weddingName" placeholder="e.g. Sarah & Ahmed" {...register("weddingName")} />
        <FieldError message={errors.weddingName?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="partnerOneName">Partner one</Label>
          <Input id="partnerOneName" placeholder="e.g. Sarah" {...register("partnerOneName")} />
          <FieldError message={errors.partnerOneName?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partnerTwoName">Partner two</Label>
          <Input id="partnerTwoName" placeholder="e.g. Ahmed" {...register("partnerTwoName")} />
          <FieldError message={errors.partnerTwoName?.message} />
        </div>
      </div>
    </>
  );
}

function StepDate() {
  const { register, formState: { errors } } = useFormContext<FormValues>();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="weddingDate">Wedding date</Label>
        <Input id="weddingDate" type="date" {...register("weddingDate")} />
        <FieldError message={errors.weddingDate?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">City or location (optional)</Label>
        <Input id="location" placeholder="e.g. Dubai" {...register("location")} />
      </div>
    </>
  );
}

function StepMoney() {
  const { register, watch, formState: { errors } } = useFormContext<FormValues>();
  const currency = watch("currency");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select id="currency" {...register("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimatedGuestCount">Estimated guests</Label>
          <Input id="estimatedGuestCount" inputMode="numeric" placeholder="e.g. 180" {...register("estimatedGuestCount")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="totalBudget">Total budget ({currency})</Label>
        <Input id="totalBudget" inputMode="decimal" placeholder="e.g. 120000" {...register("totalBudget")} />
        <FieldError message={errors.totalBudget?.message} />
      </div>
    </>
  );
}

function StepStyle() {
  const { register } = useFormContext<FormValues>();
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="weddingType">Wedding type</Label>
        <Select id="weddingType" {...register("weddingType")}>
          <option value="">Not sure yet</option>
          {WEDDING_TYPES.map((t) => (
            <option key={t} value={t}>{t[0]?.toUpperCase()}{t.slice(1)}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="planningStage">Where are you in planning?</Label>
        <Select id="planningStage" {...register("planningStage")}>
          <option value="">Just engaged</option>
          <option value="date_set">Date is set</option>
          <option value="venue_booked">Venue booked</option>
          <option value="vendors">Booking vendors</option>
          <option value="final_stretch">Final stretch</option>
        </Select>
      </div>
      <p className="text-xs text-stone-warm">
        You can change all of this later in Settings.
      </p>
    </>
  );
}
