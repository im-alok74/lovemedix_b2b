import Link from "next/link"
import { MessageCircle, Phone, Stethoscope } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { DoctorCard } from "@/components/doctors/doctor-card"
import { SupportSection } from "@/components/support-section"
import { findDoctors, findSpecializations, type ConsultationMode } from "@/lib/doctors"
import { locationLabel } from "@/lib/location"
import { getDeliveryLocation } from "@/lib/location-server"
import { buildMetadata } from "@/lib/seo"
import { SITE, telUrl, whatsappUrl } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Talk to a doctor",
  description: `Consult verified doctors on ${SITE.name} — online video consultations and clinic appointments near you.`,
  path: "/doctors",
})

export const dynamic = "force-dynamic"

const MODES: ReadonlyArray<{ value: ConsultationMode; label: string }> = [
  { value: "online", label: "Online consultation" },
  { value: "clinic", label: "Clinic visit" },
]

function parseMode(value: string | undefined): ConsultationMode | null {
  return value === "online" || value === "clinic" ? value : null
}

/**
 * Doctor discovery.
 *
 * Filters are rendered from real coverage: the specialisation chips come from a query
 * that counts verified doctors, so a chip can never lead to an empty result. When there
 * are no doctors at all the filters disappear entirely rather than sitting above nothing.
 */
export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ speciality?: string; mode?: string }>
}) {
  const params = await searchParams
  const mode = parseMode(params.mode)

  const [location, specializations] = await Promise.all([
    getDeliveryLocation(),
    findSpecializations(),
  ])

  // Only honour a specialisation that actually exists — a hand-typed query string should
  // not produce a heading for a speciality with nobody in it.
  const selected = specializations.find((entry) => entry.slug === params.speciality) ?? null

  const doctors = await findDoctors(location, { specialization: selected?.name ?? null, mode }, 36)
  const where = location ? locationLabel(location) : null

  function filterHref(next: { speciality?: string | null; mode?: string | null }) {
    const search = new URLSearchParams()
    const speciality = next.speciality === undefined ? selected?.slug : next.speciality
    const nextMode = next.mode === undefined ? mode : next.mode
    if (speciality) search.set("speciality", speciality)
    if (nextMode) search.set("mode", nextMode)
    const queryString = search.toString()
    return queryString ? `/doctors?${queryString}` : "/doctors"
  }

  return (
    <PageShell
      wide
      title={selected ? `${selected.name}s${where ? ` near ${where}` : ""}` : "Talk to a doctor"}
      description={
        selected?.description ??
        "Consult a verified doctor online, or book an appointment at a clinic near you. Doctors on Davaa are listed only after their medical council registration has been checked."
      }
      crumbs={[{ name: "Doctors", path: "/doctors" }]}
      after={<SupportSection />}
    >
      {doctors.length > 0 || specializations.length > 0 ? (
        <div className="mb-6 space-y-3">
          {specializations.length > 0 ? (
            <nav aria-label="Specialisation">
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link
                    href={filterHref({ speciality: null })}
                    aria-current={selected ? undefined : "page"}
                    className={`inline-block rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-border text-muted-foreground hover:border-primary hover:text-primary"
                        : "border-primary bg-primary text-primary-foreground"
                    }`}
                  >
                    All
                  </Link>
                </li>
                {specializations.map((entry) => {
                  const active = selected?.slug === entry.slug
                  return (
                    <li key={entry.slug}>
                      <Link
                        href={filterHref({ speciality: entry.slug })}
                        aria-current={active ? "page" : undefined}
                        className={`inline-block rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                        }`}
                      >
                        {entry.name}
                        <span className="ml-1 opacity-70">{entry.doctor_count}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          ) : null}

          <nav aria-label="Consultation type">
            <ul className="flex flex-wrap gap-2">
              {MODES.map((entry) => {
                const active = mode === entry.value
                return (
                  <li key={entry.value}>
                    <Link
                      href={filterHref({ mode: active ? null : entry.value })}
                      aria-current={active ? "page" : undefined}
                      className={`inline-block rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {entry.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      ) : null}

      {doctors.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="surface p-6 sm:p-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
            <Stethoscope className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <h2 className="mt-3 text-base font-semibold text-foreground">
            {selected || mode ? "No doctors match this filter yet" : "Doctors are joining Davaa"}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {selected || mode ? (
              <>
                We have not onboarded a doctor for this yet.{" "}
                <Link href="/doctors" className="font-medium text-primary hover:underline">
                  See all doctors
                </Link>{" "}
                or tell us what you need and we will help you find care.
              </>
            ) : (
              <>
                We are verifying the first doctors on the platform and will list them here as soon
                as their registration checks are complete. We would rather show you nobody than
                somebody we have not checked.
              </>
            )}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="outline" asChild>
              <a
                href={whatsappUrl(`Hi ${SITE.name}, I need help finding a doctor.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
                WhatsApp us
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={telUrl()}>
                <Phone className="mr-1.5 h-4 w-4" aria-hidden />
                {SITE.contact.phone}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pharmacies">Find healthcare near you</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            If this is a medical emergency, call your nearest hospital or emergency service
            immediately — do not wait for an online consultation.
          </p>
        </div>
      )}
    </PageShell>
  )
}
