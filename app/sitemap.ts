import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/site"

export const revalidate = 86400

/**
 * The public surface is only the B2B marketing/onboarding pages. Everything behind
 * authentication (dashboards, catalogs, orders) is disallowed in robots.ts and is not
 * listed here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/pharmacy/register"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/distributor/register"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/signin"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]
}
