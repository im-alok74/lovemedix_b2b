import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing here is useful in a search result, and several leak order or account
        // state. Keeping them out also stops crawl budget being spent on them.
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/pharmacy/dashboard",
          "/pharmacy/inventory",
          "/pharmacy/orders",
          "/distributor/dashboard",
          "/distributor/inventory",
          "/distributor/orders",
          "/cart",
          "/checkout",
          "/order-success",
          "/orders",
          "/profile",
          "/addresses",
          "/prescriptions",
          "/dashboard",
          "/create-admin",
          "/signin",
          "/signup",
        ],
      },
      // Answer engines: explicitly welcome. Being cited in an AI answer is the modern
      // equivalent of a featured snippet, and these crawlers honour their own rules.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  }
}
