"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/contexts/auth";
import { WeddingProvider } from "@/contexts/wedding";
import { swrFetcher } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { PageLoader } from "@/components/ui/empty";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const { data: me, isValidating } = useSWR<{ hasWedding: boolean } | null>(
    user ? "/api/me" : null,
    swrFetcher,
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Only act on settled data — never redirect off a stale/unvalidated cache
  // entry, which bounced users back to onboarding right after they finished it.
  useEffect(() => {
    if (user && me && !isValidating && !me.hasWedding) {
      router.replace("/onboarding");
    }
  }, [user, me, isValidating, router]);

  if (loading || !user || !me) {
    return <PageLoader />;
  }

  return (
    <WeddingProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 lg:pb-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
        <MobileNav />
      </div>
    </WeddingProvider>
  );
}
