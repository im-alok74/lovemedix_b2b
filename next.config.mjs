/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development"

/**
 * Content-Security-Policy.
 *
 * 'unsafe-inline' on style-src is required by Tailwind's runtime style injection and by
 * inline `style` props. 'unsafe-eval' is dev-only (React Refresh needs it).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://onemg.gumlet.io https://images.apollo247.in",
  "connect-src 'self' https://*.neon.tech https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years, preload-eligible. Only meaningful once the site is HTTPS-only.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=(self)" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
]

const nextConfig = {
  reactStrictMode: true,

  // Do not ship a build that does not typecheck. The previous config set
  // ignoreBuildErrors: true, which let real type errors reach production.
  typescript: {
    ignoreBuildErrors: false,
  },

  // No `eslint` key: Next 16 removed `next lint`, so the option is unrecognised and the
  // dev server warned "Invalid next.config.mjs options detected" on every boot. Builds no
  // longer run ESLint at all — `npm run lint` (eslint .) is the entry point, in CI.

  images: {
    // Image optimisation was disabled, which inflates LCP and directly costs Core Web
    // Vitals — and therefore search ranking — on a catalog site full of product photos.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "onemg.gumlet.io", pathname: "/**" },
      { protocol: "https", hostname: "images.apollo247.in", pathname: "/**" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // Smaller client bundles: only the icons actually imported get shipped.
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },

  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Immutable content-hashed assets.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },

  async redirects() {
    return [
      // Old brand path, kept so any existing inbound links do not 404.
      { source: "/lovemedix", destination: "/", permanent: true },
    ]
  },
}

export default nextConfig
