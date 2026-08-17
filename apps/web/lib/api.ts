"use client";

const CONFIGURED_API = process.env.NEXT_PUBLIC_API_URL ?? "";

function resolveApiBase(): string {
  if (CONFIGURED_API) return CONFIGURED_API;
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // Served over a LAN IP (e.g. phone testing) — assume the API shares the host.
      return `http://${hostname}:4000`;
    }
  }
  return "http://localhost:4000";
}

const API_BASE = resolveApiBase();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter = async () => null;
let onUnauthorized: (() => void) | null = null;

export function configureApi(opts: {
  getToken: TokenGetter;
  onUnauthorized?: () => void;
}): void {
  tokenGetter = opts.getToken;
  onUnauthorized = opts.onUnauthorized ?? null;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await tokenGetter();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => null)) as {
    error?: { code: string; message: string };
    [key: string]: unknown;
  } | null;

  if (!res.ok) {
    if (res.status === 401) {
      onUnauthorized?.();
    }
    throw new ApiError(
      res.status,
      data?.error?.code ?? "unknown",
      data?.error?.message ?? "Something went wrong. Please try again.",
    );
  }

  return data as T;
}

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export const swrFetcher = async <T,>(path: string): Promise<T> => api<T>(path);
