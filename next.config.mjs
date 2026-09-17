import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://storage.googleapis.com https://ltwhgdieituhchunjeyv.supabase.co; font-src 'self'; connect-src 'self' https://ltwhgdieituhchunjeyv.supabase.co wss://ltwhgdieituhchunjeyv.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/oscar-storage/**",
      },
    ],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev()
