import Image from "next/image"
import Link from "next/link"
import { MapPin, Video } from "lucide-react"

import { formatDistance } from "@/lib/location"
import { formatINR } from "@/lib/pricing"
import type { DoctorSummary } from "@/lib/doctors"

/** Initials, used when a doctor has not supplied a photograph. */
function initials(name: string): string {
  return name
    .replace(/^(dr\.?|prof\.?)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Doctor tile.
 *
 * A doctor without a photograph gets their initials, not a stock portrait. Putting a
 * generic photo of a stranger in a white coat on a real doctor's profile misrepresents a
 * named individual — and every patient who later meets them learns the site is not
 * literal about what it shows.
 *
 * Fees are shown per mode because they genuinely differ; a single "from ₹X" would hide
 * the fact that a clinic visit costs more than a video call.
 */
export function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  const href = `/doctors/${doctor.id}`
  const distance = formatDistance(doctor.distance_km)
  const languages = doctor.languages?.filter(Boolean) ?? []

  return (
    <article className="surface surface-hover relative flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        {doctor.photo_url ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
            <Image src={doctor.photo_url} alt="" fill sizes="56px" className="object-cover" />
          </div>
        ) : (
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
            aria-hidden
          >
            {initials(doctor.full_name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-foreground">
            <Link href={href} className="after:absolute after:inset-0 hover:text-primary">
              <span className="line-clamp-2">{doctor.full_name}</span>
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{doctor.specialization}</p>
          {doctor.qualifications ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{doctor.qualifications}</p>
          ) : null}
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {doctor.experience_years != null ? (
          <li>
            <span className="font-medium text-foreground">{doctor.experience_years} years</span> experience
          </li>
        ) : null}

        {languages.length > 0 ? <li>Speaks {languages.join(", ")}</li> : null}

        {doctor.city ? (
          <li className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {distance ? `${distance} · ` : ""}
            {doctor.clinic_name ? `${doctor.clinic_name}, ` : ""}
            {doctor.city}
          </li>
        ) : null}
      </ul>

      <div className="mt-auto pt-3">
        <ul className="flex flex-wrap gap-1.5 text-xs">
          {doctor.offers_online ? (
            <li className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-muted-foreground">
              <Video className="h-3.5 w-3.5 text-primary" aria-hidden />
              Online
              {doctor.consultation_fee_online != null
                ? ` · ${formatINR(doctor.consultation_fee_online)}`
                : ""}
            </li>
          ) : null}
          {doctor.offers_clinic ? (
            <li className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
              Clinic
              {doctor.consultation_fee_clinic != null
                ? ` · ${formatINR(doctor.consultation_fee_clinic)}`
                : ""}
            </li>
          ) : null}
        </ul>

        {/* Stated only when a published availability row covers today. */}
        {doctor.available_today ? (
          <p className="mt-2 text-xs font-medium text-[color:var(--success)]">Available today</p>
        ) : null}
      </div>
    </article>
  )
}
