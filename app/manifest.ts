import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // Matches the brand teal in the mark and the OG card. The previous #0f766e was a
    // different green and did not appear anywhere else in the product.
    theme_color: "#0F7B93",
    orientation: "portrait",
    categories: ["medical", "health", "shopping"],
    lang: "en-IN",
    // A maskable 512 is what Android uses for the home-screen icon; without one the
    // launcher shrinks the mark inside a white circle. All four files exist in public/.
    icons: [
      { src: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Browse medicines", url: "/medicines" },
      { name: "Upload prescription", url: "/upload-prescription" },
      { name: "My orders", url: "/orders" },
    ],
  }
}
