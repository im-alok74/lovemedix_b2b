import Image from "next/image"
import { notFound } from "next/navigation"
import { BadgeCheck, MapPin, MessageCircle, Phone, Video } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { SupportSection } from "@/components/support-section"
import { WEEKDAY_NAMES, getDoctorAvailability, getDoctorById } from "@/lib/doctors"
import { formatINR } from "@/lib/pricing"
import { buildMetadata } from "@/lib/seo"
import { SITE, telUrl, whatsappUrl } from "@/lib/site"

export const dynamic = "force-dynamic"

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = parseId(id)

  // noIndex on both dead-page branches — see the same note in app/pharmacies/[id]:
  // notFound() cannot set a 404 status here, so the page's own robots directive is what
  // keeps a soft 404 out of the index.
  if (numericId === null) {
    return buildMetadata({ title: "Doctor not found", path: `/doctors/${id}`, noIndex: true })
  }

  const doctor = await getDoctorById(numericId)
  if (!doctor) {
    return buildMetadata({ title: "Doctor not found", path: `/doctors/${id}`, noIndex: true })
  }

  return buildMetadata({
    title: `${doctor.full_name} — ${doctor.specialization}`,
    description: `${doctor.full_name}, ${doctor.specialization}${doctor.city ? ` in ${doctor.city}` : ""}. Consult online or book a clinic appointment on ${SITE.name}.`,
    path: `/doctors/${numericId}`,
  })
}

function initials(name: string): string {
  return name
    .replace(/^(dr\.?|prof\.?)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = parseId(id)
  if (numericId === null) notFound()

  const doctor = await getDoctorById(numericId)
  if (!doctor) notFound()

  const availability = await getDoctorAvailability(doctor.id)
  const languages = doctor.languages?.filter(Boolean) ?? []

  const requestText = `Hi ${SITE.name}, I would like to book an appointment with ${doctor.full_name} (${doctor.specialization}).`

  return (
    <PageShell
      wide
      title={doctor.full_name}
      description={doctor.qualifications ? `${doctor.specialization} · ${doctor.qualifications}` : doctor.specialization}
      crumbs={[
        { name: "Doctors", path: "/doctors" },
        { name: doctor.full_name, path: `/doctors/${doctor.id}` },
      ]}
      after={<SupportSection />}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="surface flex items-start gap-4 p-5">
            {doctor.photo_url ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                <Image src={doctor.photo_url} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ) : (
              <span
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground"
                aria-hidden
              >
                {initials(doctor.full_name)}
              </span>
            )}

            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
                Registration verified
              </p>
              {doctor.registration_council ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Registered with {doctor.registration_council}
                </p>
              ) : null}

              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {doctor.experience_years != null ? (
                  <li>
                    <span className="font-medium text-foreground">{doctor.experience_years} years</span> of
                    practice
                  </li>
                ) : null}
                {languages.length > 0 ? <li>Speaks {languages.join(", ")}</li> : null}
                {doctor.clinic_name || doctor.city ? (
                  <li className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      {doctor.clinic_name ? <span className="text-foreground">{doctor.clinic_name}</span> : null}
                      {doctor.clinic_address ? <span className="block">{doctor.clinic_address}</span> : null}
                      <span className="block">
                        {[doctor.city, doctor.state, doctor.pincode].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          {doctor.bio ? (
            <section aria-labelledby="about-heading" className="surface p-5">
              <h2 id="about-heading" className="text-base font-semibold text-foreground">
                About
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
            </section>
          ) : null}

          {availability.length > 0 ? (
            <section aria-labelledby="hours-heading" className="surface p-5">
              <h2 id="hours-heading" className="text-base font-semibold text-foreground">
                Consulting hours
              </h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {availability.map((slot, index) => (
                  <li key={`${slot.weekday}-${slot.start_time}-${slot.mode}-${index}`} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-foreground">{WEEKDAY_NAMES[slot.weekday]}</span>
                    <span className="text-muted-foreground">
                      {slot.start_time} – {slot.end_time}
                      <span className="ml-2 text-xs uppercase tracking-wide">
                        {slot.mode === "online" ? "Online" : "Clinic"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-5">
            <h2 className="text-base font-semibold text-foreground">Book a consultation</h2>

            <ul className="mt-3 space-y-2.5 text-sm">
              {doctor.offers_online ? (
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Video className="h-4 w-4 text-primary" aria-hidden />
                    Online consultation
                  </span>
                  {doctor.consultation_fee_online != null ? (
                    <span className="price">{formatINR(doctor.consultation_fee_online)}</span>
                  ) : null}
                </li>
              ) : null}

              {doctor.offers_clinic ? (
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden />
                    Clinic visit
                  </span>
                  {doctor.consultation_fee_clinic != null ? (
                    <span className="price">{formatINR(doctor.consultation_fee_clinic)}</span>
                  ) : null}
                </li>
              ) : null}
            </ul>

            {/* Appointments are arranged by the Davaa team while the self-serve booking
                flow is being built. The button says what it does rather than opening a
                calendar that cannot actually reserve a slot. */}
            <div className="mt-4 space-y-2">
              <Button className="w-full" asChild>
                <a href={whatsappUrl(requestText)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
                  Request an appointment
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={telUrl()}>
                  <Phone className="mr-1.5 h-4 w-4" aria-hidden />
                  Call {SITE.contact.phone}
                </a>
              </Button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              We confirm the time with the doctor and message you back. {SITE.support.hours}.
            </p>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            A consultation is not a substitute for emergency care. If symptoms are severe or
            worsening, contact your nearest hospital immediately.
          </p>
        </aside>
      </div>
    </PageShell>
  )
}
