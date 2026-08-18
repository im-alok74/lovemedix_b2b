import { unstable_cache } from "next/cache"

/**
 * Cross-request cache for public, non-personalised data.
 *
 * ## Why this exists
 *
 * Every route in this app renders dynamically, because `<Header />` reads the session
 * cookie and that opts the whole route tree out of static rendering. A `revalidate = 300`
 * export on a page containing the header therefore does nothing — the page is still
 * rebuilt, and every query inside it re-run, for every visitor.
 *
 * React's `cache()` does not help here either: it deduplicates a call *within a single
 * render pass*, so six homepage sections sharing `getStockedCatalog()` cost one query per
 * request rather than six. It still costs one query per request, per user.
 *
 * `unstable_cache` is the piece that was missing. It persists the *result* in Vercel's
 * Data Cache across requests and across users, so N visitors inside one revalidation
 * window cost one database round trip instead of N.
 *
 * ## The rule
 *
 * Only wrap data that is identical for every visitor. Never wrap anything derived from
 * cookies, headers, the session, a cart, an order, or a payment — `unstable_cache` throws
 * if the callback touches `cookies()`/`headers()`, but that guard does not stop you
 * caching a user id you passed in as an argument. That mistake serves one customer's data
 * to another, so the argument list matters as much as the callback.
 */

/**
 * Revalidation windows, in seconds, by how volatile the data actually is.
 *
 * These are deliberately conservative for anything touching price or stock: a stale price
 * on a pharmacy is a customer-facing error, not a cache miss. Catalogue *shape* (which
 * categories and brands exist) changes far more slowly than catalogue *state* (what is in
 * stock and at what price), so the two get different windows.
 */
export const TTL = {
  /** Price and stock. Short enough that an out-of-stock item clears quickly. */
  INVENTORY: 60,
  /** Which products exist, their names and images. Changes on catalogue edits. */
  CATALOG: 5 * 60,
  /** Category tiles, brand rails, health-condition lists. Effectively editorial. */
  TAXONOMY: 30 * 60,
  /** Footer link blocks, sitemap inputs. Only needs to be fresh for crawlers. */
  SEO: 60 * 60,
} as const

/**
 * Cache tags, so a write can invalidate exactly what it affected instead of waiting out
 * the TTL. Call `revalidateTag(TAGS.inventory)` after a stock or price change.
 */
export const TAGS = {
  catalog: "catalog",
  inventory: "inventory",
  taxonomy: "taxonomy",
  seo: "seo",
} as const

type Tag = (typeof TAGS)[keyof typeof TAGS]

interface CacheOptions {
  /** Seconds before the entry is considered stale. Use a value from `TTL`. */
  revalidate: number
  /** Tags that can invalidate this entry early. */
  tags: Tag[]
}

/**
 * Wraps a zero-argument public data loader in the cross-request Data Cache.
 *
 * Restricted to zero-argument loaders on purpose. `unstable_cache` builds its key from
 * the key parts plus the serialised arguments, and the most common way to leak data
 * between users is to cache a function that takes a `userId`. Anything user-specific
 * should not be here at all, so the type system refuses to express it.
 *
 * @example
 *   export const getCategoryTiles = cachedPublic(
 *     loadCategoryTiles, ["category-tiles"],
 *     { revalidate: TTL.TAXONOMY, tags: [TAGS.taxonomy] },
 *   )
 */
export function cachedPublic<T>(
  loader: () => Promise<T>,
  keyParts: string[],
  options: CacheOptions,
): () => Promise<T> {
  return unstable_cache(loader, keyParts, {
    revalidate: options.revalidate,
    tags: options.tags,
  })
}

/**
 * Same, for loaders that take simple scalar arguments (a slug, a limit, a page number).
 *
 * Every argument becomes part of the cache key, so keep the cardinality low: caching by
 * slug is fine, caching by free-text search query is not — it fills the cache with
 * single-use entries and evicts the ones that get hits.
 */
/** Scalars that serialise into a stable cache key. `null` is included because most of
 *  these loaders take optional coordinates or an optional pincode. */
export type CacheKeyArg = string | number | boolean | null

export function cachedPublicBy<A extends readonly CacheKeyArg[], T>(
  loader: (...args: A) => Promise<T>,
  keyParts: string[],
  options: CacheOptions,
): (...args: A) => Promise<T> {
  return unstable_cache(loader, keyParts, {
    revalidate: options.revalidate,
    tags: options.tags,
  })
}

/**
 * Snaps a coordinate to roughly a 1 km grid so nearby users share a cache entry.
 *
 * "Which pharmacies are near this point" is a function of geography, not of who is asking,
 * so it is safe to share — but only if the key is coarse. Keyed on raw GPS every visitor
 * gets a private entry, the hit rate collapses to zero, and the cache becomes pure
 * overhead. Two decimal places is ~1.1 km, which is well inside the delivery radius these
 * queries filter on, so bucketing cannot change which pharmacies qualify in practice.
 *
 * It also keeps exact device coordinates out of cache keys, which is the right default for
 * location data regardless of performance.
 */
export function geoBucket(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "" : value.toFixed(2)
}

