"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import useSWR, { type SWRConfiguration } from "swr";
import type { Wedding, Role } from "@wedding/shared";
import { swrFetcher } from "@/lib/api";

interface WeddingContextValue {
  wedding: Wedding | undefined;
  role: Role | undefined;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  refreshInterval: 30_000,
};

export function WeddingProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<{
    wedding: Wedding;
    role: Role;
  }>("/api/wedding", swrFetcher, swrConfig);

  return (
    <WeddingContext.Provider
      value={{
        wedding: data?.wedding,
        role: data?.role,
        loading: isLoading,
        error: error ? "We couldn't load your wedding." : null,
        refresh: async () => {
          await mutate();
        },
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding(): WeddingContextValue {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding must be used inside WeddingProvider");
  return ctx;
}

export function useSwrList<T>(path: string | null) {
  return useSWR<{ [key: string]: T[] } | null>(path, swrFetcher, swrConfig);
}
