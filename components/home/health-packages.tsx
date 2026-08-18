import Image from "next/image"
import Link from "next/link"
import { BadgeCheck, Clock, Home } from "lucide-react"

import { cachedPublicBy, TAGS, TTL } from "@/lib/cache"
import { query } from "@/lib/db"
import { formatINR } from "@/lib/pricing"

/**
 * Health check-up packages.
 *
 * Renders nothing until a verified diagnostics partner has real packages in the
 * `health_packages` table (migration 027). That is not a stub — it is the section
 * working correctly with an empty shelf.
 *
 * Worth being explicit about why, because the obvious shortcut is tempting: a competitor
 * homepage shows "Comprehensive Gold Full Body Checkup — ₹2499, was ₹4998, 50% off", and
 * copying those cards would make this page look complete in ten minutes. It would also be
 * advertising a medical service that cannot be booked, at a price nobody agreed, from a
 * lab that does not exist. On a pharmacy that is not placeholder content.
 *
 * The discount is computed from `mrp` and `price` at render time rather than stored, so a
 * "50% off" badge cannot outlive the price behind it.
 */

interface PackageRow {
  id: number
  name: string
  slug: string | null
  test_count: number | null
  report_hours: number | null
  home_collection: boolean
  preparation: string | null
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

async function loadHealthPackages(limit: number): Promise<PackageRow[]> {
  try {
    return await query<PackageRow>`
      SELECT
        hp.id, hp.name, hp.slug, hp.test_count, hp.report_hours,
        hp.home_collection, hp.preparation, hp.image_url, hp.mrp, hp.price,
        dl.name AS lab_name, dl.accreditation
      FROM health_packages hp
      JOIN diagnostic_labs dl
        ON dl.id = hp.lab_id AND dl.verification_status = 'verified'
      WHERE hp.is_active
      ORDER BY hp.display_order ASC, hp.price ASC
      LIMIT ${limit}
    `
  } catch (error) {
    // The table arrives in migration 027. A database that has not run it must render the
    // rest of the homepage normally rather than 500 — same contract as the doctors rail.
    console.error("[health-packages] query failed:", error)
    return []
  }
}

/**
 * Cached: the package catalogue is editorial content that changes on admin edits, not on
 * traffic. Uncached this ran on every homepage render for every visitor.
 */
const getHealthPackages = cachedPublicBy(loadHealthPackages, ["health-packages"], {
  revalidate: TTL.TAXONOMY,
  tags: [TAGS.taxonomy],
})

export async function HealthPackages() {
  const packages = await getHealthPackages(4)

  if (packages.length === 0) return null

  return (
    <section aria-labelledby="checkups-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="checkups-heading" className="home-h2">
              Health check-ups
            </h2>
            <p className="home-meta mt-1">Booked with accredited labs near you</p>
          </div>
          <Link href="/health-checkups" className="home-link shrink-0">
            View all
          </Link>
        </div>

        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {packages.map((pkg) => {
            const mrp = toNumber(pkg.mrp)
            const price = toNumber(pkg.price)
            const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

            return (
              <li key={pkg.id} className="w-64 shrink-0 snap-start sm:w-auto">
                <article className="surface surface-hover relative flex h-full flex-col p-4">
                  {pkg.image_url ? (
                    <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-md bg-muted/40">
                      <Image src={pkg.image_url} alt="" fill sizes="280px" className="object-cover" />
                    </div>
                  ) : null}

                  <h3 className="home-h3">
                    <Link
                      href={pkg.slug ? `/health-checkups/${pkg.slug}` : `/health-checkups/${pkg.id}`}
                      className="after:absolute after:inset-0 hover:text-primary"
                    >
                      <span className="line-clamp-2">{pkg.name}</span>
                    </Link>
                  </h3>

                  <p className="home-meta mt-1 flex items-center gap-1">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{pkg.lab_name}</span>
                  </p>

                  <ul className="home-meta mt-2 space-y-0.5">
                    {pkg.test_count ? <li>{pkg.test_count} tests included</li> : null}
                    {pkg.report_hours ? (
                      <li className="flex items-center gap-1">
                        <Clock className="h-4 w-4 shrink-0" aria-hidden />
                        Report in {pkg.report_hours} hours
                      </li>
                    ) : null}
                    {pkg.home_collection ? (
                      <li className="flex items-center gap-1">
                        <Home className="h-4 w-4 shrink-0" aria-hidden />
                        Sample collected at home
                      </li>
                    ) : null}
                  </ul>

                  <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
                    <span className="price text-lg">{formatINR(price)}</span>
                    {off > 0 ? (
                      <>
                        <span className="price-strike">{formatINR(mrp)}</span>
                        <span className="text-sm font-bold text-[color:var(--success)]">{off}% off</span>
                      </>
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
