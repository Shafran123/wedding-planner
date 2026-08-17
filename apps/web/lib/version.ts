export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.1";
export const APP_SHA = process.env.NEXT_PUBLIC_APP_SHA ?? "dev";
export const RELEASE_CHANNEL = "Beta";
export const APP_ENVIRONMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV ??
  (process.env.NODE_ENV === "production" ? "production" : "development");

export const VERSION_LABEL = `v${APP_VERSION} · ${RELEASE_CHANNEL}`;
export const FULL_VERSION = `v${APP_VERSION}+${APP_SHA}`;
