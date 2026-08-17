import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@wedding/shared"],
  // Allow dev access from other devices on the local network (e.g. phone testing).
  allowedDevOrigins: ["10.16.2.49"],
};

export default nextConfig;
