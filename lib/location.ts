/**
 * Delivery location — a first-class concept, not a homepage widget.
 *
 * Medicine inventory is local: which pharmacies exist, what they stock, what they charge
 * and how fast they can deliver are all functions of where the customer is. Every
 * discovery surface (nearby pharmacies, "available near you", price comparison, delivery
 * ETA) reads the location from here rather than asking for a pincode again.
 *
 * The value lives in an httpOnly cookie so server components can render location-aware
 * markup on the first paint — no client fetch, no layout shift, no flash of "select your
 * location". The client updates it through POST /api/location, which is also the only
 * place that writes it.
 *
 * This module is deliberately isomorphic — no `next/headers`, no database. The location
 * picker is a client component and imports the type, the city list and the label helpers
 * from here; pulling `cookies()` in alongside them would drag server-only code into the
 * browser bundle and fail the build. Reading the cookie lives in `lib/location-server.ts`.
 *
 * Nothing here is hardcoded to Patna. The launch city is a *default suggestion* in the
 * picker, not an assumption baked into components.
 */

export const LOCATION_COOKIE = "davaa_location"

/** 90 days. Long enough that a returning customer never re-enters their pincode. */
export const LOCATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

export interface DeliveryLocation {
  /** 6-digit Indian pincode. Null when the user picked a city or shared GPS only. */
  pincode: string | null
  city: string | null
  state: string | null
  /** Present only when the user explicitly shared device location. */
  latitude: number | null
  longitude: number | null
  /** How the location was obtained — drives the copy in the picker. */
  source: "gps" | "pincode" | "city"
}

/**
 * Cities Davaa serves at launch, offered as one-tap options in the picker.
 *
 * This is a convenience list for the *selector UI only*. It is deliberately not used to
 * filter results anywhere — that comes from real pharmacy rows — so adding a city here
 * costs nothing and removing one breaks nothing.
 */
export const SUGGESTED_CITIES: ReadonlyArray<{ city: string; state: string }> = [
  { city: "Patna", state: "Bihar" },
  { city: "Bihta", state: "Bihar" },
  { city: "Danapur", state: "Bihar" },
  { city: "Nalanda", state: "Bihar" },
  { city: "Gaya", state: "Bihar" },
  { city: "Muzaffarpur", state: "Bihar" },
]

function toCoordinate(value: unknown, limit: number): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  if (!Number.isFinite(n) || Math.abs(n) > limit) return null
  return n
}

function toName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, 100)
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Parses whatever is in the cookie into a trusted shape.
 *
 * Cookies are user-controlled input. Every field is validated and clamped here so a
 * hand-edited cookie cannot reach a SQL parameter as an unbounded string, and so an
 * old cookie format degrades to `null` rather than throwing during render.
 */
export function parseLocation(raw: string | undefined | null): DeliveryLocation | null {
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== "object") return null
  const record = parsed as Record<string, unknown>

  const pincode = typeof record.pincode === "string" && /^[1-9]\d{5}$/.test(record.pincode)
    ? record.pincode
    : null
  const city = toName(record.city)
  const state = toName(record.state)
  const latitude = toCoordinate(record.latitude, 90)
  const longitude = toCoordinate(record.longitude, 180)

  // A location with no usable signal at all is the same as having no location.
  if (!pincode && !city && (latitude === null || longitude === null)) return null

  const source: DeliveryLocation["source"] =
    record.source === "gps" || record.source === "pincode" || record.source === "city"
      ? record.source
      : latitude !== null && longitude !== null
        ? "gps"
        : pincode
          ? "pincode"
          : "city"

  return { pincode, city, state, latitude, longitude, source }
}

export function serializeLocation(location: DeliveryLocation): string {
  return JSON.stringify(location)
}

/** Short label for the header chip: "Patna", "801103", or "Set location". */
export function locationLabel(location: DeliveryLocation | null): string {
  if (!location) return "Set location"
  if (location.city) return location.city
  if (location.pincode) return location.pincode
  return "Near you"
}

/** Longer label used where there is room: "Patna, Bihar · 800001". */
export function locationDescription(location: DeliveryLocation | null): string | null {
  if (!location) return null
  const place = [location.city, location.state].filter(Boolean).join(", ")
  if (place && location.pincode) return `${place} · ${location.pincode}`
  return place || location.pincode || "Using your current location"
}

/** True when we can compute real distances rather than only matching a pincode. */
export function hasCoordinates(
  location: DeliveryLocation | null,
): location is DeliveryLocation & { latitude: number; longitude: number } {
  return location?.latitude != null && location.longitude != null
}

/**
 * Human-readable distance.
 *
 * Under a kilometre reads better in metres, and precision beyond 100 m is noise given
 * pharmacy coordinates are usually rooftop-approximate.
 */
export function formatDistance(km: number | string | null | undefined): string | null {
  const value = typeof km === "number" ? km : Number.parseFloat(String(km ?? ""))
  if (!Number.isFinite(value) || value < 0) return null
  if (value < 1) return `${Math.max(50, Math.round((value * 1000) / 50) * 50)} m`
  return `${value.toFixed(1)} km`
}

/**
 * Rough delivery estimate from distance.
 *
 * Deliberately a *range* and deliberately conservative. An exact "30 min" promise the
 * platform cannot keep costs more in refunds and trust than a wider window costs in
 * conversion. Once real dispatch timings exist, this is the one place to replace.
 */
export function estimateDeliveryWindow(km: number | null): string | null {
  if (km == null || !Number.isFinite(km)) return null
  if (km <= 2) return "30–60 min"
  if (km <= 5) return "1–2 hours"
  if (km <= 10) return "2–4 hours"
  return "Same day"
}
