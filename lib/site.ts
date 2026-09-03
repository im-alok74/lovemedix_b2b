/**
 * Single source of truth for brand identity, contact details and SEO defaults.
 * Everything that renders the company name — page titles, invoices, structured
 * data — reads from here.
 */

export const SITE = {
  name: "Lovemedix",
  legalName: "Lovemedix Healthcare Private Limited",
  tagline: "B2B Pharmaceutical Marketplace",
  description:
    "Lovemedix connects verified pharmacies with approved pharmaceutical distributors for wholesale bulk procurement, inventory management and B2B invoicing.",

  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://lovemedix.in").replace(/\/$/, ""),

  contact: {
    email: "support@lovemedix.in",
    phone: "+91 95081 78521",
    address: {
      street: "Silao",
      locality: "Nalanda",
      region: "Bihar",
      postalCode: "803117",
      country: "IN",
    },
  },

  social: {
    linkedin: "https://www.linkedin.com/company/lovemedix",
  },
} as const

/** `tel:` href with the spaces stripped, which some dialers choke on. */
export function telUrl(): string {
  return `tel:${SITE.contact.phone.replace(/\s/g, "")}`
}

/** Builds an absolute URL for canonicals, OpenGraph and structured data. */
export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Page title helper. Home passes nothing and gets the brand line; every other page
 * gets "Page · Lovemedix".
 */
export function pageTitle(title?: string): string {
  return title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`
}
