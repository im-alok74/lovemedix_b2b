import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, Clock, MapPin, Truck } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { SupportSection } from "@/components/support-section"
import { MedicineCard, type MedicineCardData } from "@/components/medicines/medicine-card"
import { estimateDeliveryWindow, formatDistance } from "@/lib/location"
import { getDeliveryLocation } from "@/lib/location-server"
import { getPharmacyById, getPharmacyInventory } from "@/lib/pharmacies"
import { buildMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

/**
 * A single pharmacy's storefront.
 *
 * Verified pharmacies only — `getPharmacyById` filters on verification status, so an
 * unverified or rejected applicant has no public page and cannot be linked into one by
 * guessing an id.
 */
export const dynamic = "force-dynamic"

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = parseId(id)

  /**
   * `noIndex` on the dead-page branches is load-bearing.
   *
   * Next 16 cannot set a 404 status once a dynamic page has started streaming, so
   * `notFound()` below renders app/not-found.tsx with HTTP 200 — a soft 404. That file
   * declares a global noindex to stop those being indexed, but a page's own
   * generateMetadata still runs and wins on title and robots. Returning the default
   * `index, follow` here would therefore re-enable indexing of every dead pharmacy URL.
   */
  if (numericId === null) {
    return buildMetadata({ title: "Pharmacy not found", path: `/pharmacies/${id}`, noIndex: true })
  }

  const pharmacy = await getPharmacyById(numericId, null)
  if (!pharmacy) {
    return buildMetadata({ title: "Pharmacy not found", path: `/pharmacies/${id}`, noIndex: true })
  }

  return buildMetadata({
    title: `${pharmacy.pharmacy_name}, ${pharmacy.city}`,
    description: `${pharmacy.pharmacy_name} is a verified pharmacy on ${SITE.name} in ${pharmacy.city}, ${pharmacy.state}. See what it has in stock and order for delivery or pickup.`,
    path: `/pharmacies/${numericId}`,
  })
}

export default async function PharmacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = parseId(id)
  if (numericId === null) notFound()

  const location = await getDeliveryLocation()
  const pharmacy = await getPharmacyById(numericId, location)
  if (!pharmacy) notFound()

  const medicines = (await getPharmacyInventory(numericId, 24)) as MedicineCardData[]
  const distance = formatDistance(pharmacy.distance_km)
  const eta = estimateDeliveryWindow(pharmacy.distance_km)

  const hours = pharmacy.is_24x7
    ? "Open 24 hours, every day"
    : pharmacy.opening_time && pharmacy.closing_time
      ? `${pharmacy.opening_time} – ${pharmacy.closing_time}`
      : null

  return (
    <PageShell
      wide
      title={pharmacy.pharmacy_name}
      description={`${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.pincode}`}
      crumbs={[
        { name: "Pharmacies", path: "/pharmacies" },
        { name: pharmacy.pharmacy_name, path: `/pharmacies/${pharmacy.id}` },
      ]}
      after={<SupportSection />}
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li className="surface flex items-start gap-3 p-4">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">{SITE.name} verified</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Drug licence checked before listing</p>
          </div>
        </li>

        <li className="surface flex items-start gap-3 p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              {distance ? `${distance} away` : pharmacy.city}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {distance ? pharmacy.city : "Set your location for distance"}
            </p>
          </div>
        </li>

        <li className="surface flex items-start gap-3 p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              {pharmacy.is_open === true ? "Open now" : pharmacy.is_open === false ? "Closed now" : "Opening hours"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{hours ?? "Not published"}</p>
          </div>
        </li>

        <li className="surface flex items-start gap-3 p-4">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              {pharmacy.delivers_here ? "Delivers to you" : "Pickup from store"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {pharmacy.delivers_here && eta ? `Usually ${eta}` : `Collect at ${pharmacy.city}`}
            </p>
          </div>
        </li>
      </ul>

      <section aria-labelledby="stock-heading" className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="stock-heading" className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            In stock at this pharmacy
          </h2>
          {medicines.length > 0 ? (
            <Link href="/medicines" className="shrink-0 text-sm font-medium text-primary hover:underline">
              Search all medicines
            </Link>
          ) : null}
        </div>

        {medicines.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {medicines.map((medicine) => (
                <MedicineCard key={medicine.id} medicine={medicine} />
              ))}
            </div>
            {pharmacy.in_stock_count > medicines.length ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Showing {medicines.length} of {pharmacy.in_stock_count} medicines in stock here.{" "}
                <Link href="/medicines" className="font-medium text-primary hover:underline">
                  Search for a specific medicine
                </Link>
                .
              </p>
            ) : null}
          </>
        ) : (
          <div className="surface p-6">
            <p className="text-sm font-medium text-foreground">
              This pharmacy has not published its stock list yet.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You can still order through {SITE.name} — upload your prescription and we will check
              with them and other pharmacies near you.
            </p>
            <Link
              href="/upload-prescription"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Upload a prescription
            </Link>
          </div>
        )}
      </section>
    </PageShell>
  )
}
