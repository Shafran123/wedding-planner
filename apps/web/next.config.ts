import type { NextConfig } from "next";
import { version } from "../../package.json";

const nextConfig: NextConfig = {
  transpilePackages: ["@wedding/shared"],
  // Allow dev access from other devices on the local network (e.g. phone testing).
  allowedDevOrigins: ["10.16.2.49"],
  // The root package.json version is the single source of truth for releases
  // (the CD pipeline bumps it and injects the git sha per deploy).
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? version,
    NEXT_PUBLIC_APP_SHA: process.env.NEXT_PUBLIC_APP_SHA ?? "dev",
  },
};

export default nextConfig;
