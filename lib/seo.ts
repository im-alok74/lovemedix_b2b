import type { Metadata } from "next"

import { SITE, absoluteUrl, pageTitle } from "./site"

/**
 * SEO and AEO helpers.
 *
 * SEO gets the page ranked. AEO (answer-engine optimisation) gets the page *quoted* by
 * an AI assistant or a Google AI Overview — which needs facts stated plainly, marked up
 * as structured data, and answerable without reading the whole page. Both are covered
 * here: `buildMetadata` for the crawler, the `*Jsonld` builders for the answer engine.
 */

interface MetadataInput {
  title?: string
  description?: string
  /** Site-relative path, e.g. "/medicines/dolo-650". Used for the canonical URL. */
  path?: string
  image?: string
  /** Set for account pages, carts and dashboards — nothing private should be indexed. */
  noIndex?: boolean
  keywords?: string[]
}

export function buildMetadata({
  title,
  description = SITE.description,
  path = "/",
  image,
  noIndex = false,
  keywords,
}: MetadataInput = {}): Metadata {
  const url = absoluteUrl(path)

  /**
   * The root layout declares `title.template = "%s · Davaa.in"`, so a page must return
   * only its own title — returning "X · Davaa.in" here produced "X · Davaa.in · Davaa.in".
   * Pages with no title of their own opt out of the template entirely.
   */
  const resolvedTitle = title ?? { absolute: pageTitle() }

  // OpenGraph and Twitter cards have no template applied, so they need the full string.
  const socialTitle = pageTitle(title)
  const ogImage = image ?? absoluteUrl("/og-default.png")

  return {
    title: resolvedTitle,
    description,
    keywords,
    // A canonical on every page stops filter/sort query strings from splitting ranking
    // signals across dozens of near-duplicate URLs.
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: socialTitle,
      description,
      url,
      locale: "en_IN",
      images: [{ url: ogImage, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [ogImage],
    },
  }
}

/* ------------------------------------------------------------------ *
 * JSON-LD builders
 * ------------------------------------------------------------------ */

export function organizationJsonld() {
  return {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "@id": absoluteUrl("/#organization"),
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: absoluteUrl("/davaa-logo.png"),
    description: SITE.description,
    email: SITE.contact.email,
    telephone: SITE.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.contact.address.street,
      addressLocality: SITE.contact.address.locality,
      addressRegion: SITE.contact.address.region,
      postalCode: SITE.contact.address.postalCode,
      addressCountry: SITE.contact.address.country,
    },
    areaServed: { "@type": "Country", name: "India" },
    sameAs: Object.values(SITE.social),
  }
}

/** Enables the sitelinks search box in Google results. */
export function websiteJsonld() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/medicines?search={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  }
}

interface ProductJsonldInput {
  name: string
  description?: string | null
  image?: string | null
  brand?: string | null
  sku: string | number
  price: number
  inStock: boolean
  url: string
  ratingValue?: number | null
  reviewCount?: number | null
}

export function productJsonld(input: ProductJsonldInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description || undefined,
    image: input.image || undefined,
    sku: String(input.sku),
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: "INR",
      price: input.price.toFixed(2),
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": absoluteUrl("/#organization") },
    },
    // Only emitted when reviews genuinely exist. Fabricating aggregateRating is a
    // structured-data policy violation and gets rich results revoked.
    aggregateRating:
      input.ratingValue && input.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: input.ratingValue,
            reviewCount: input.reviewCount,
          }
        : undefined,
  }
}

export function breadcrumbJsonld(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqJsonld(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }
}

export function itemListJsonld(items: Array<{ name: string; path: string }>, listName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  }
}
