import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Le socle expose du TypeScript brut : c'est Next qui le compile.
  transpilePackages: ["@sejour/socle"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
    ],
  },
};

export default nextConfig;
