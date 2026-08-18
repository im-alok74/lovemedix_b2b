import "server-only"

import { cookies } from "next/headers"
import { cache } from "react"

import { LOCATION_COOKIE, parseLocation, type DeliveryLocation } from "@/lib/location"

/**
 * Server-side access to the delivery location.
 *
 * Split out from `lib/location.ts` because that module is imported by the location
 * picker, which is a client component: `next/headers` in the same file would be pulled
 * into the browser bundle and break the build. Same split as `auth-edge` / `auth-server`.
 *
 * The `server-only` import makes that mistake fail loudly at build time rather than
 * subtly, if this module is ever imported from a client component.
 */

/**
 * The current delivery location, or null if the visitor has not chosen one.
 *
 * `cache()` de-duplicates the cookie read across a single render — the header, the
 * homepage rails and the product page all call it without three separate lookups.
 */
export const getDeliveryLocation = cache(async (): Promise<DeliveryLocation | null> => {
  const store = await cookies()
  return parseLocation(store.get(LOCATION_COOKIE)?.value)
})
