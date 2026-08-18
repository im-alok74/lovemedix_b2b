/**
 * Single source of truth for brand identity, contact details and SEO defaults.
 *
 * Everything that renders the company name — page titles, invoices, emails, structured
 * data — reads from here so every B2B surface stays consistent.
 */

export const SITE = {
  name: "LoveMedix",
  legalName: "LoveMedix Healthcare Private Limited",
  tagline: "Verified wholesale medicine supply",
  description:
    "LoveMedix is a verified B2B medicine procurement platform connecting approved pharmacies and distributors across India.",

  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://lovemedix.in").replace(/\/$/, ""),

  contact: {
    email: "support@lovemedix.in",
    phone: "+91 9508178521",
    address: {
      street: "Silao",
      locality: "Nalanda",
      region: "Bihar",
      postalCode: "803117",
      country: "IN",
    },
  },

  social: {
    facebook: "https://facebook.com/lovemedix",
    twitter: "https://twitter.com/lovemedix",
    instagram: "https://instagram.com/lovemedix",
  },

  /** Platform support details for approved business accounts. */
  promise: {
    deliveryWindow: "Same-day dispatch for available stock",
    freeDeliveryAbove: 0,
    returnWindow: "As agreed between business partners",
  },

  /**
   * Human assistance channels.
   *
   * A large share of the launch audience will not complete an order entirely on their
   * own — someone ordering for a parent, someone who does not know the medicine name,
   * someone whose prescription is handwritten. These channels are surfaced on the
   * homepage and in the footer, not buried on a contact page.
   *
   * `whatsappNumber` is digits only with country code, as wa.me requires.
   */
  support: {
    whatsappNumber: "919508178521",
    hours: "9am–8pm, Monday to Saturday",
  },
} as const

  /** Prefilled WhatsApp deep link. `text` becomes the first message a business user sends. */
export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${SITE.support.whatsappNumber}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

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
 * gets a concise branded title.
 */
export function pageTitle(title?: string): string {
  return title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`
}
