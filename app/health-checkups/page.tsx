import Link from "next/link"
import { BadgeCheck, Clock, FlaskConical, Home, MessageCircle, Phone } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { SupportSection } from "@/components/support-section"
import { query } from "@/lib/db"
import { formatINR } from "@/lib/pricing"
import { buildMetadata } from "@/lib/seo"
import { SITE, telUrl, whatsappUrl } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Lab tests and health check-ups",
  description: `Book diagnostic tests and full-body health check-ups with accredited labs on ${SITE.name}, with home sample collection where available.`,
  path: "/health-checkups",
})

export const dynamic = "force-dynamic"

/**
 * Lab tests and health check-ups.
 *
 * This route exists because the homepage links to it. It was previously linked from the
 * "View all" on the packages rail and from nowhere else — and the route did not exist, so
 * that link 404'd whenever the rail was populated.
 *
 * `health_packages` is empty today, so the honest render is the empty state below rather
 * than a grid of invented packages. Copying a competitor's "Full Body Checkup ₹2499, 50%
 * off" would mean advertising a medical service that cannot be booked, at a price nobody
 * agreed, from a lab that does not exist. The empty state offers the two things that do
 * work: a phone number and WhatsApp.
 */

interface PackageRow {
  id: number
  name: string
  slug: string | null
  test_count: number | null
  report_hours: number | null
  home_collection: boolean
  image_url: string | null
  mrp: string | number
  price: string | number
  lab_name: string
  accreditation: string | null
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  return Number.isFinite(n) ? n : 0
}

async function getPackages(): Promise<PackageRow[]> {
  try {
    return await query<PackageRow>`
      SELECT
        hp.id, hp.name, hp.slug, hp.test_count, hp.report_hours,
        hp.home_collection, hp.image_url, hp.mrp, hp.price,
        dl.name AS lab_name, dl.accreditation
      FROM health_packages hp
      JOIN diagnostic_labs dl
        ON dl.id = hp.lab_id AND dl.verification_status = 'verified'
      WHERE hp.is_active
      ORDER BY hp.display_order ASC, hp.price ASC
      LIMIT 48
    `
  } catch (error) {
    // Table arrives in migration 027. A database without it renders the empty state
    // rather than a 500 — same contract as the homepage rail.
    console.error("[health-checkups] query failed:", error)
    return []
  }
}

export default async function HealthCheckupsPage() {
  const packages = await getPackages()

  return (
    <PageShell
      wide
      title="Lab tests and health check-ups"
      description="Book a diagnostic test or a full-body check-up with an accredited lab. Every lab listed here has had its accreditation checked before a single package goes live."
      crumbs={[{ name: "Health check-ups", path: "/health-checkups" }]}
      after={<SupportSection />}
    >
      {packages.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const mrp = toNumber(pkg.mrp)
            const price = toNumber(pkg.price)
            const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

            return (
              <li key={pkg.id}>
                <article className="surface surface-hover relative flex h-full flex-col p-4">
                  <h2 className="home-h3">
                    <Link
                      href={pkg.slug ? `/health-checkups/${pkg.slug}` : `/health-checkups/${pkg.id}`}
                      className="after:absolute after:inset-0 hover:text-primary"
                    >
                      <span className="line-clamp-2">{pkg.name}</span>
                    </Link>
                  </h2>

                  <p className="home-meta mt-1 flex items-center gap-1">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{pkg.lab_name}</span>
                  </p>

                  <ul className="home-meta mt-2 space-y-0.5">
                    {pkg.test_count ? <li>{pkg.test_count} tests included</li> : null}
                    {pkg.report_hours ? (
                      <li className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Reports in {pkg.report_hours} hours
                      </li>
                    ) : null}
                    {pkg.home_collection ? (
                      <li className="flex items-center gap-1">
                        <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Home sample collection
                      </li>
                    ) : null}
                  </ul>

                  <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
                    <span className="price text-lg">{formatINR(price)}</span>
                    {off > 0 ? (
                      <>
                        <span className="price-strike">{formatINR(mrp)}</span>
                        <span className="price-save">{off}% off</span>
                      </>
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="surface p-6 sm:p-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
            <FlaskConical className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <h2 className="mt-3 text-base font-semibold text-foreground">
            Lab bookings are opening soon
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            We are signing up accredited diagnostic labs and will list their packages here
            with real prices once their accreditation checks are complete. Until then, call
            or message us and we will help you arrange the test you need.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="outline" asChild>
              <a
                href={whatsappUrl(`Hi ${SITE.name}, I need help booking a lab test.`)}
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
              <Link href="/medicines">Browse medicines</Link>
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
