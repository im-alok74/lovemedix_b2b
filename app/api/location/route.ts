import type { NextRequest } from "next/server"
import { z } from "zod"

import { badRequest, handleApiError, ok, tooManyRequests } from "@/lib/api-response"
import { query } from "@/lib/db"
import {
  LOCATION_COOKIE,
  LOCATION_COOKIE_MAX_AGE,
  serializeLocation,
  type DeliveryLocation,
} from "@/lib/location"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { pincodeSchema } from "@/lib/validation"

/**
 * Sets or clears the visitor's delivery location.
 *
 * This is the only writer of the location cookie. Doing it server-side means the cookie
 * can stay httpOnly, and — more usefully — it lets us *resolve* a raw input into a real
 * place before storing it: a pincode becomes "Patna, Bihar", and shared GPS coordinates
 * become the nearest city we actually serve.
 *
 * The resolution uses Davaa's own rows (serviceable_pincodes, verified pharmacies). No
 * third-party geocoder is called, which keeps the CSP tight, avoids sending a customer's
 * coordinates to an external service, and means the answer always reflects real coverage.
 */

const bodySchema = z.union([
  z.object({ pincode: pincodeSchema }),
  z.object({
    city: z.string().trim().min(2, "City name is too short").max(100),
    state: z.string().trim().max(100).optional(),
  }),
  z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
])

interface PlaceRow {
  city: string | null
  state: string | null
  pincode?: string | null
}

/** Nearest verified pharmacy within 60 km, used to name a set of raw coordinates. */
async function resolveFromCoordinates(latitude: number, longitude: number): Promise<PlaceRow | null> {
  const [row] = await query<PlaceRow>`
    SELECT city, state, pincode
    FROM pharmacy_profiles
    WHERE verification_status = 'verified'
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND 6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians(${latitude})) * cos(radians(latitude))
            * cos(radians(longitude) - radians(${longitude}))
            + sin(radians(${latitude})) * sin(radians(latitude))
          ))) <= 60
    ORDER BY 6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians(${latitude})) * cos(radians(latitude))
            * cos(radians(longitude) - radians(${longitude}))
            + sin(radians(${latitude})) * sin(radians(latitude))
          ))) ASC
    LIMIT 1
  `
  return row ?? null
}

/** Pincode → place. Prefers the serviceability table, falls back to pharmacy rows. */
async function resolveFromPincode(pincode: string): Promise<PlaceRow | null> {
  const [serviceable] = await query<PlaceRow>`
    SELECT city, state FROM serviceable_pincodes WHERE pincode = ${pincode} AND is_active LIMIT 1
  `
  if (serviceable?.city) return serviceable

  const [pharmacy] = await query<PlaceRow>`
    SELECT city, state FROM pharmacy_profiles
    WHERE pincode = ${pincode} AND verification_status = 'verified'
    LIMIT 1
  `
  return pharmacy ?? serviceable ?? null
}

export async function POST(request: NextRequest) {
  try {
    // Each call runs one or two indexed lookups. Generous enough for a customer fiddling
    // with the picker, tight enough that it cannot be used to sweep the pincode table.
    const limit = rateLimit(clientKey(request, "location"), 30, 60_000)
    if (!limit.allowed) return tooManyRequests(limit.retryAfter)

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Enter a valid location")
    }

    const input = parsed.data
    let location: DeliveryLocation

    if ("pincode" in input) {
      // A pincode we cannot name is still a usable delivery location — we just store it
      // without a city rather than rejecting the customer's own postcode.
      const place = await resolveFromPincode(input.pincode).catch(() => null)
      location = {
        pincode: input.pincode,
        city: place?.city ?? null,
        state: place?.state ?? null,
        latitude: null,
        longitude: null,
        source: "pincode",
      }
    } else if ("city" in input) {
      location = {
        pincode: null,
        city: input.city,
        state: input.state ?? null,
        latitude: null,
        longitude: null,
        source: "city",
      }
    } else {
      const place = await resolveFromCoordinates(input.latitude, input.longitude).catch(() => null)
      location = {
        pincode: place?.pincode ?? null,
        city: place?.city ?? null,
        state: place?.state ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
        source: "gps",
      }
    }

    const response = ok({ location })
    response.cookies.set(LOCATION_COOKIE, serializeLocation(location), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: LOCATION_COOKIE_MAX_AGE,
      path: "/",
    })
    return response
  } catch (error) {
    return handleApiError(error, "location.set")
  }
}

export async function DELETE() {
  const response = ok({ location: null })
  response.cookies.set(LOCATION_COOKIE, "", { maxAge: 0, path: "/" })
  return response
}
