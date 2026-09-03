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
    theme_color: "#0F7B93",
    orientation: "portrait",
    categories: ["medical", "business", "productivity"],
    lang: "en-IN",
    icons: [
      { src: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Pharmacy dashboard", url: "/pharmacy/dashboard" },
      { name: "Distributor dashboard", url: "/distributor/dashboard" },
      { name: "Admin panel", url: "/admin" },
    ],
  }
}
