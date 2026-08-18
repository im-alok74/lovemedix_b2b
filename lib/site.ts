/**
 * Single source of truth for brand identity, contact details and SEO defaults.
 *
 * Everything that renders the company name — page titles, invoices, emails, structured
 * data — reads from here. Previously "Davaa.in" and "Davaa.in" were hardcoded in
 * different files and the storefront disagreed with the invoices.
 */

export const SITE = {
  name: "Davaa.in",
  legalName: "Davaa Pharma Private Limited",
  tagline: "Medicines in Minutes",
  description:
    "Order prescription and OTC medicines online from verified pharmacies. Genuine medicines, transparent pricing and fast doorstep delivery across India.",

  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://davaa.in").replace(/\/$/, ""),

  contact: {
    email: "support@davaa.in",
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
    facebook: "https://facebook.com/davaain",
    twitter: "https://twitter.com/davaain",
    instagram: "https://instagram.com/davaain",
  },

  /** Delivery promise shown across the storefront. Keep in sync with reality. */
  promise: {
    deliveryWindow: "2–24 hours",
    freeDeliveryAbove: 500,
    returnWindow: "7 days",
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

/** Prefilled WhatsApp deep link. `text` becomes the first message the customer sends. */
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
 * gets "Page · Davaa.in", which keeps titles under the ~60 chars Google renders.
 */
export function pageTitle(title?: string): string {
  return title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`
}
