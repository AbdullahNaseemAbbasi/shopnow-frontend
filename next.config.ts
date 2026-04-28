import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Hide the dev-only "Rendering / Static / Dynamic" badge in the corner.
  // Production builds never show it; this just cleans up the dev UI.
  devIndicators: false,
};

export default nextConfig;
