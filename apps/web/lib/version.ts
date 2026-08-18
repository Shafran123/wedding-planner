export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.1";
export const APP_SHA = process.env.NEXT_PUBLIC_APP_SHA ?? "dev";
export const RELEASE_CHANNEL = "Beta";
export const APP_ENVIRONMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV ??
  (process.env.NODE_ENV === "production" ? "production" : "development");

const SHORT_SHA = APP_SHA !== "dev" ? APP_SHA.slice(0, 7) : APP_SHA;

export const VERSION_LABEL = `v${APP_VERSION} · ${RELEASE_CHANNEL}`;
export const FULL_VERSION = `v${APP_VERSION}+${SHORT_SHA}`;
