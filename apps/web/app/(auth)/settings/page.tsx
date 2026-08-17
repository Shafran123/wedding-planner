"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, UserMinus, Check, UserRound, Heart, Users, BellRing, ScrollText } from "lucide-react";
import type { Activity, Invitation, Member } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { useWedding } from "@/contexts/wedding";
import { parseToMinor } from "@/lib/money";
import { PageHeader } from "@/components/shared/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListSkeleton } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from "@/lib/labels";
import { ROLES, CURRENCIES, WEDDING_TYPES, invitationSchema } from "@wedding/shared";
import { TZ_CHOICES } from "@/lib/timezones";
import { relativeTime } from "@/lib/format";

export default function SettingsPage() {
  const { role } = useWedding();
  const [tab, setTab] = useState("profile");
  const canManageMembers = role === "owner";

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, your wedding, and the people planning it with you." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile"><UserRound className="mr-1.5 h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="wedding"><Heart className="mr-1.5 h-3.5 w-3.5" /> Wedding</TabsTrigger>
          <TabsTrigger value="members"><Users className="mr-1.5 h-3.5 w-3.5" /> Members</TabsTrigger>
          <TabsTrigger value="preferences"><BellRing className="mr-1.5 h-3.5 w-3.5" /> Preferences</TabsTrigger>
          <TabsTrigger value="activity"><ScrollText className="mr-1.5 h-3.5 w-3.5" /> Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="wedding"><WeddingTab canEdit={role === "owner"} /></TabsContent>
        <TabsContent value="members"><MembersTab canManage={canManageMembers} canInvite={canManageMembers || role === "partner"} /></TabsContent>
        <TabsContent value="preferences"><PreferencesTab /></TabsContent>
        <TabsContent value="activity"><ActivityTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { updateProfile, getClientAuth } = await import("@/lib/firebase");
      const auth = getClientAuth();
      if (!auth) throw new Error("Firebase is not configured.");
      await updateProfile(auth.currentUser ?? user, { displayName: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't update your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <div className="flex gap-2">
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
              <Button variant="gold" onClick={() => void saveName()} disabled={busy || !name.trim()}>
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-stone-warm">Email</dt><dd className="text-charcoal">{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-warm">Provider</dt><dd className="text-charcoal">{user?.providerData[0]?.providerId === "google.com" ? "Google" : "Email & password"}</dd></div>
          </dl>
          {saved && <p className="text-sm font-medium text-emerald-700">Saved ✓</p>}
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          <p className="rounded-lg bg-parchment px-3 py-2 text-xs text-stone-warm">
            Email and password are managed by Firebase authentication.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const weddingSchema = z.object({
  weddingName: z.string().min(2).max(120),
  partnerOneName: z.string().min(1).max(80),
  partnerTwoName: z.string().max(80).optional(),
  weddingDate: z.string().min(1),
  currency: z.string().length(3),
  estimatedGuestCount: z.string().optional(),
  totalBudgetInput: z.string().optional(),
  weddingType: z.string().optional(),
  location: z.string().max(200).optional(),
  timezone: z.string().max(60),
});
type WeddingFormValues = z.input<typeof weddingSchema>;

function WeddingTab({ canEdit }: { canEdit: boolean }) {
  const { wedding, refresh } = useWedding();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WeddingFormValues>({
    resolver: zodResolver(weddingSchema),
    values: {
      weddingName: wedding?.weddingName ?? "",
      partnerOneName: wedding?.partnerOneName ?? "",
      partnerTwoName: wedding?.partnerTwoName ?? "",
      weddingDate: wedding?.weddingDate ? wedding.weddingDate.slice(0, 10) : "",
      currency: wedding?.currency ?? "AED",
      estimatedGuestCount: wedding?.estimatedGuestCount !== undefined ? String(wedding.estimatedGuestCount) : "",
      totalBudgetInput: wedding ? String(wedding.totalBudgetMinor / 100) : "",
      weddingType: wedding?.weddingType ?? "",
      location: wedding?.location ?? "",
      timezone: wedding?.timezone ?? "Asia/Dubai",
    },
  });

  const onSubmit = async (values: WeddingFormValues) => {
    setError(null);
    try {
      await api("/api/wedding", {
        method: "PATCH",
        body: {
          weddingName: values.weddingName,
          partnerOneName: values.partnerOneName,
          partnerTwoName: values.partnerTwoName || undefined,
          weddingDate: new Date(`${values.weddingDate}T12:00:00`).toISOString(),
          currency: values.currency,
          estimatedGuestCount: values.estimatedGuestCount ? Number(values.estimatedGuestCount) : undefined,
          totalBudgetMinor: values.totalBudgetInput ? (parseToMinor(values.totalBudgetInput) ?? undefined) : undefined,
          weddingType: values.weddingType || undefined,
          location: values.location || undefined,
          timezone: values.timezone,
        },
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't update your wedding.");
    }
  };

  if (!wedding) return <ListSkeleton rows={4} />;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Wedding</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <fieldset disabled={!canEdit} className="space-y-3 disabled:opacity-60">
            <div className="space-y-1.5">
              <Label htmlFor="w-name">Wedding name</Label>
              <Input id="w-name" {...register("weddingName")} />
              <FieldError message={errors.weddingName?.message} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="w-p1">Partner one</Label>
                <Input id="w-p1" {...register("partnerOneName")} />
                <FieldError message={errors.partnerOneName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-p2">Partner two</Label>
                <Input id="w-p2" {...register("partnerTwoName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-date">Wedding date</Label>
                <Input id="w-date" type="date" {...register("weddingDate")} />
                <FieldError message={errors.weddingDate?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-currency">Currency</Label>
                <Select id="w-currency" {...register("currency")}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-guests">Estimated guests</Label>
                <Input id="w-guests" inputMode="numeric" {...register("estimatedGuestCount")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-budget">Total budget</Label>
                <Input id="w-budget" inputMode="decimal" {...register("totalBudgetInput")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-type">Wedding type</Label>
                <Select id="w-type" {...register("weddingType")}>
                  <option value="">Not set</option>
                  {WEDDING_TYPES.map((t) => (
                    <option key={t} value={t}>{t[0]?.toUpperCase()}{t.slice(1)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-location">City / location</Label>
                <Input id="w-location" {...register("location")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-timezone">Timezone</Label>
                <Select id="w-timezone" {...register("timezone")}>
                  {TZ_CHOICES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </Select>
              </div>
            </div>
          </fieldset>
          {!canEdit && (
            <p className="text-xs text-stone-warm">Only the wedding owner can edit these settings.</p>
          )}
          {error && <FieldError message={error} />}
          {canEdit && (
            <div className="flex items-center gap-3">
              <Button type="submit" variant="gold">Save changes</Button>
              {saved && <span className="text-sm font-medium text-emerald-700">Saved ✓</span>}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

type InviteFormValues = z.input<typeof invitationSchema>;

function MembersTab({ canManage, canInvite }: { canManage: boolean; canInvite: boolean }) {
  const { data, isLoading } = useSWR<{ members: Member[] }>("/api/members", swrFetcher);
  const { data: inviteData } = useSWR<{ invitations: Invitation[] }>("/api/invitations", swrFetcher);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { email: "", role: "partner" },
  });

  const members = data?.members ?? [];
  const invitations = inviteData?.invitations ?? [];

  const invite = async (values: InviteFormValues) => {
    setError(null);
    try {
      const res = await api<{ inviteUrl: string }>("/api/invitations", {
        method: "POST",
        body: values,
      });
      const url = `${window.location.origin}${res.inviteUrl}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(values.email);
      } catch {
        setError(`Invite created. Share this link: ${url}`);
      }
      reset({ email: "", role: "partner" });
      await mutate("/api/invitations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send the invitation.");
    }
  };

  const changeRole = async (member: Member, role: string) => {
    await api(`/api/wedding/members/${member.id}`, { method: "PATCH", body: { role } });
    await mutate("/api/members");
  };

  const removeMember = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await api(`/api/wedding/members/${removing.id}`, { method: "DELETE" });
      await mutate("/api/members");
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton rows={2} />
          ) : (
            <ul className="divide-y divide-sand">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-charcoal">
                    {member.displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {member.displayName}
                      {member.role === "owner" && " (you)"}
                    </p>
                    <p className="truncate text-xs text-stone-warm">{member.email}</p>
                  </div>
                  {canManage && member.role !== "owner" ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => void changeRole(member, e.target.value)}
                        className="h-8 rounded-lg border border-sand bg-white px-2 text-xs"
                        aria-label={`Role for ${member.displayName}`}
                      >
                        {ROLES.filter((r) => r !== "owner").map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${member.displayName}`} onClick={() => setRemoving(member)}>
                        <UserMinus className="h-4 w-4 text-red-700" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="gold">{ROLE_LABELS[member.role]}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Invite someone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(invite)} className="space-y-3" noValidate>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-56 flex-1 space-y-1.5">
                  <Label htmlFor="i-email">Email</Label>
                  <Input id="i-email" type="email" placeholder="partner@example.com" {...register("email")} />
                  <FieldError message={errors.email?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="i-role">Role</Label>
                  <Select id="i-role" {...register("role")}>
                    <option value="partner">Partner</option>
                    <option value="planner">Planner</option>
                    <option value="viewer">Viewer</option>
                  </Select>
                </div>
                <Button type="submit" variant="gold">
                  <Plus className="h-4 w-4" /> Invite
                </Button>
              </div>
              {copied && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <Check className="h-4 w-4" /> Invite link for {copied} copied to clipboard.
                </p>
              )}
              {error && <FieldError message={error} />}
            </form>
            <div className="mt-4 space-y-2">
              {ROLES.filter((r) => r !== "owner").map((r) => (
                <p key={r} className="text-xs text-stone-warm">
                  <span className="font-semibold text-charcoal">{ROLE_LABELS[r]}:</span> {ROLE_DESCRIPTIONS[r]}
                </p>
              ))}
            </div>
            {invitations.filter((i) => i.status === "pending").length > 0 && (
              <div className="mt-4 border-t border-sand pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-warm">Pending invitations</p>
                <ul className="space-y-1.5">
                  {invitations.filter((i) => i.status === "pending").map((i) => (
                    <li key={i.id} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal">{i.email}</span>
                      <Badge variant="outline">{ROLE_LABELS[i.role]}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove member?"
        description={`${removing?.displayName} will lose access to this wedding.`}
        busy={busy}
        onConfirm={() => void removeMember()}
      />
    </div>
  );
}

function PreferencesTab() {
  const { wedding } = useWedding();
  const [inAppOn, setInAppOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("wp:inapp-notifications") !== "off";
  });

  const toggle = (checked: boolean) => {
    setInAppOn(checked);
    window.localStorage.setItem("wp:inapp-notifications", checked ? "on" : "off");
    window.dispatchEvent(new Event("wp:notif-prefs-changed"));
  };

  return (
    <Card className="max-w-lg">
      <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span className="text-charcoal">
            In-app notifications
            <span className="block text-xs text-stone-warm">Tasks due soon, payments due, budget alerts, upcoming events</span>
          </span>
          <input
            type="checkbox"
            checked={inAppOn}
            onChange={(e) => toggle(e.target.checked)}
            className="h-4 w-4 accent-[#b3924e]"
            aria-label="In-app notifications"
          />
        </label>
        <p className="rounded-lg bg-parchment px-3 py-2 text-xs text-stone-warm">
          Email and push notification controls are coming soon.
          {wedding?.timezone ? ` Timezone: ${wedding.timezone}.` : ""}
        </p>
      </CardContent>
    </Card>
  );
}

function ActivityTab() {
  const { data, error, isLoading, size, setSize } = useSwrActivity();
  const activities = data?.flatMap((page) => page.activities) ?? [];
  const hasMore = data?.[data.length - 1]?.nextCursor !== undefined;

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
      <CardContent>
        {isLoading && <ListSkeleton rows={5} />}
        {error && <p className="text-sm text-red-700">We couldn't load the activity feed.</p>}
        {!isLoading && activities.length === 0 && (
          <p className="py-8 text-center text-sm text-stone-warm">No activity yet.</p>
        )}
        <ul className="divide-y divide-sand">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3 text-sm">
              <Badge variant="outline" className="mt-0.5 shrink-0">{a.entityType}</Badge>
              <p className="min-w-0 flex-1 text-charcoal">{a.message}</p>
              <span className="shrink-0 text-xs text-stone-warm">{relativeTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void setSize(size + 1)}>
            Load more
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function useSwrActivity() {
  const getKey = (pageIndex: number, previousPageData: { activities: Activity[]; nextCursor?: string } | null) => {
    if (previousPageData && previousPageData.nextCursor === undefined) return null;
    const cursor = previousPageData?.nextCursor;
    return `/api/activity?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
  };
  const swr = useSWRInfinite<{ activities: Activity[]; nextCursor?: string }>(
    getKey,
    swrFetcher,
  );
  return swr;
}
