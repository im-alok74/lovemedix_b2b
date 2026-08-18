import { query } from "@/lib/db"
import { hasCoordinates, type DeliveryLocation } from "@/lib/location"

/**
 * Doctor discovery.
 *
 * Two rules govern everything in this file:
 *
 * 1. Only verified, accepting doctors are ever returned. Verification means an admin has
 *    seen a medical council registration number. An unverified profile has no public
 *    existence — it cannot be listed, linked to, or reached by guessing an id.
 *
 * 2. Nothing is invented. No placeholder doctors, no sample ratings, no "available today"
 *    unless a real availability row says so. On a pharmacy a fake product is a bad
 *    experience; on a doctor listing it is someone taking medical direction from a
 *    profile that does not exist.
 *
 * Every function fails soft to an empty result. The doctors tables ship in migration 026
 * and a database that has not run it yet should render the empty state, not a 500.
 */

export type ConsultationMode = "online" | "clinic"

export interface DoctorSummary {
  id: number
  full_name: string
  slug: string | null
  specialization: string
  qualifications: string | null
  photo_url: string | null
  experience_years: number | null
  languages: string[] | null
  city: string | null
  state: string | null
  clinic_name: string | null
  offers_online: boolean
  offers_clinic: boolean
  consultation_fee_online: number | null
  consultation_fee_clinic: number | null
  distance_km: number | null
  /** True only when a real availability row covers today. Never assumed. */
  available_today: boolean
}

export interface DoctorProfile extends DoctorSummary {
  bio: string | null
  clinic_address: string | null
  pincode: string | null
  registration_council: string | null
  gender: string | null
}

export interface Specialization {
  name: string
  slug: string
  description: string | null
  /** Verified, accepting doctors in this specialisation. Only shown when > 0. */
  doctor_count: number
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === "number" ? value : Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

function mapDoctor<T extends Record<string, unknown>>(row: T) {
  return {
    ...row,
    experience_years: toNullableNumber(row.experience_years),
    consultation_fee_online: toNullableNumber(row.consultation_fee_online),
    consultation_fee_clinic: toNullableNumber(row.consultation_fee_clinic),
    distance_km: toNullableNumber(row.distance_km),
    available_today: Boolean(row.available_today),
  }
}

export interface DoctorFilters {
  /** Matches `doctors.specialization` exactly, as stored. */
  specialization?: string | null
  mode?: ConsultationMode | null
}

/**
 * Verified doctors, nearest first when we can compute distance.
 *
 * Unlike pharmacies, doctors are not filtered out by distance: an online consultation
 * works from anywhere, and someone in a town with no local specialist is exactly the
 * person this is for. Distance orders the list; it does not gate it.
 */
export async function findDoctors(
  location: DeliveryLocation | null,
  { specialization = null, mode = null }: DoctorFilters = {},
  limit = 24,
): Promise<DoctorSummary[]> {
  const coords = hasCoordinates(location)
  const lat = coords ? location.latitude : null
  const lng = coords ? location.longitude : null
  const city = location?.city ?? null

  try {
    const rows = await query<Record<string, unknown>>`
      WITH ctx AS (
        SELECT
          ${lat}::float8 AS lat,
          ${lng}::float8 AS lng,
          ${city}::text AS ctx_city,
          EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Kolkata'))::int AS today
      )
      SELECT
        d.id, d.full_name, d.slug, d.specialization, d.qualifications, d.photo_url,
        d.experience_years, d.languages, d.city, d.state, d.clinic_name,
        d.offers_online, d.offers_clinic,
        d.consultation_fee_online, d.consultation_fee_clinic,
        CASE
          WHEN ctx.lat IS NULL OR d.latitude IS NULL OR d.longitude IS NULL THEN NULL
          ELSE 6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians(ctx.lat)) * cos(radians(d.latitude))
            * cos(radians(d.longitude) - radians(ctx.lng))
            + sin(radians(ctx.lat)) * sin(radians(d.latitude))
          )))
        END AS distance_km,
        EXISTS (
          SELECT 1 FROM doctor_availability da
          WHERE da.doctor_id = d.id AND da.is_active AND da.weekday = ctx.today
        ) AS available_today,
        -- Doctors in the visitor's own city rank above the rest when we have no
        -- coordinates to sort by.
        CASE WHEN ctx.ctx_city IS NOT NULL AND lower(d.city) = lower(ctx.ctx_city) THEN 0 ELSE 1 END AS city_rank
      FROM doctors d
      CROSS JOIN ctx
      WHERE d.verification_status = 'verified'
        AND d.is_accepting
        AND (${specialization}::text IS NULL OR d.specialization = ${specialization})
        AND (
          ${mode}::text IS NULL
          OR (${mode} = 'online' AND d.offers_online)
          OR (${mode} = 'clinic' AND d.offers_clinic)
        )
      ORDER BY city_rank ASC, distance_km ASC NULLS LAST, d.experience_years DESC NULLS LAST, d.full_name ASC
      LIMIT ${limit}
    `

    return rows.map(mapDoctor) as unknown as DoctorSummary[]
  } catch (error) {
    console.error("[doctors] findDoctors failed:", error)
    return []
  }
}

/** A single verified doctor's public profile, or null. */
export async function getDoctorById(id: number): Promise<DoctorProfile | null> {
  if (!Number.isInteger(id) || id <= 0) return null

  try {
    const [row] = await query<Record<string, unknown>>`
      SELECT
        d.id, d.full_name, d.slug, d.specialization, d.qualifications, d.photo_url,
        d.experience_years, d.languages, d.city, d.state, d.pincode, d.gender,
        d.clinic_name, d.clinic_address, d.bio, d.registration_council,
        d.offers_online, d.offers_clinic,
        d.consultation_fee_online, d.consultation_fee_clinic,
        NULL::float8 AS distance_km,
        EXISTS (
          SELECT 1 FROM doctor_availability da
          WHERE da.doctor_id = d.id AND da.is_active
            AND da.weekday = EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Kolkata'))::int
        ) AS available_today
      FROM doctors d
      WHERE d.id = ${id} AND d.verification_status = 'verified'
      LIMIT 1
    `

    return row ? (mapDoctor(row) as unknown as DoctorProfile) : null
  } catch (error) {
    console.error("[doctors] getDoctorById failed:", error)
    return null
  }
}

/**
 * Specialisations that actually have a doctor behind them.
 *
 * The reference table is seeded with ten entries, but a filter chip that leads to an
 * empty list is a broken promise. `HAVING count > 0` means the filter row is exactly as
 * long as the real coverage — one specialisation at launch shows one chip.
 */
export async function findSpecializations(): Promise<Specialization[]> {
  try {
    const rows = await query<Record<string, unknown>>`
      SELECT s.name, s.slug, s.description, COUNT(d.id)::int AS doctor_count
      FROM doctor_specializations s
      JOIN doctors d
        ON d.specialization = s.name
       AND d.verification_status = 'verified'
       AND d.is_accepting
      WHERE s.is_active
      GROUP BY s.id, s.name, s.slug, s.description, s.display_order
      HAVING COUNT(d.id) > 0
      ORDER BY s.display_order ASC, s.name ASC
    `
    return rows as unknown as Specialization[]
  } catch (error) {
    console.error("[doctors] findSpecializations failed:", error)
    return []
  }
}

/** A doctor's published weekly availability, grouped for display. */
export async function getDoctorAvailability(doctorId: number) {
  if (!Number.isInteger(doctorId) || doctorId <= 0) return []

  try {
    return await query<{
      weekday: number
      start_time: string
      end_time: string
      mode: ConsultationMode
    }>`
      SELECT weekday,
             to_char(start_time, 'HH12:MI AM') AS start_time,
             to_char(end_time, 'HH12:MI AM') AS end_time,
             mode
      FROM doctor_availability
      WHERE doctor_id = ${doctorId} AND is_active
      ORDER BY weekday ASC, start_time ASC
    `
  } catch (error) {
    console.error("[doctors] getDoctorAvailability failed:", error)
    return []
  }
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const
