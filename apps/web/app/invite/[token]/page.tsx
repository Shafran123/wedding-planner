"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { api, swrFetcher } from "@/lib/api";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/labels";
import type { Role } from "@wedding/shared";
import { Button } from "@/components/ui/button";
import { Spinner, PageLoader } from "@/components/ui/empty";

interface InviteView {
  weddingName?: string;
  email: string;
  role: Role;
  status: string;
  expired: boolean;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useSWR<InviteView>(
    token ? `/api/invitations/${token}` : null,
    swrFetcher,
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?invite=${encodeURIComponent(token ?? "")}`);
    }
  }, [loading, user, router, token]);

  if (loading || !user) return <PageLoader />;

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/invitations/${token}/accept`, { method: "POST" });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't accept the invitation.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft/60 text-gold">
          <Sparkles className="h-5 w-5" />
        </div>
        {isLoading ? (
          <Spinner className="mx-auto h-5 w-5 text-gold" />
        ) : !data ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-charcoal">
              Invitation not found
            </h1>
            <p className="mt-2 text-sm text-stone-warm">
              This invitation link doesn't exist or has been removed.
            </p>
          </>
        ) : data.status !== "pending" ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-charcoal">
              Invitation already used
            </h1>
            <p className="mt-2 text-sm text-stone-warm">
              This invitation has already been accepted or declined.
            </p>
            <Button className="mt-6" onClick={() => router.replace("/dashboard")}>
              Go to dashboard
            </Button>
          </>
        ) : data.expired ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-charcoal">
              Invitation expired
            </h1>
            <p className="mt-2 text-sm text-stone-warm">
              Ask the wedding owner to send a new invitation.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold text-charcoal">
              {data.weddingName ?? "A wedding"} invited you
            </h1>
            <p className="mt-2 text-sm text-stone-warm">
              You're invited to join as{" "}
              <span className="font-semibold text-charcoal">{ROLE_LABELS[data.role]}</span>.
              {ROLE_DESCRIPTIONS[data.role]}
            </p>
            <p className="mt-3 rounded-lg bg-parchment px-3 py-2 text-xs text-stone-warm">
              Invitation sent to {data.email}
            </p>
            {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.replace("/dashboard")}>
                Decline
              </Button>
              <Button variant="gold" onClick={accept} disabled={busy}>
                {busy && <Spinner />} Accept invitation
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
