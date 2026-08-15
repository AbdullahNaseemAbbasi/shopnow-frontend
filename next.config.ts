import type { NextConfig } from "next";

// Security headers applied to every response. These are the ones a security review expects to see:
// stop MIME sniffing, clickjacking, referrer leakage, and lock down powerful browser features we
// don't use. HSTS only takes effect over HTTPS (ignored on local http), which is exactly right.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Hide the dev-only "Rendering / Static / Dynamic" badge in the corner.
  // Production builds never show it; this just cleans up the dev UI.
  devIndicators: false,
  // Never ship the "Powered by Next.js" fingerprint.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
