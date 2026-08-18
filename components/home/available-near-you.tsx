import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PharmacyOffers } from "@/components/pharmacies/pharmacy-offers"
import { locationLabel } from "@/lib/location"
import { getDeliveryLocation } from "@/lib/location-server"
import { findAvailableNearYou } from "@/lib/pharmacies"
import { formatINR } from "@/lib/pricing"
import { medicineImageSrc } from "@/lib/images"

/**
 * "Available near you" — the section this product exists for.
 *
 * A national catalogue tells you a medicine exists. This tells you which shops within a
 * few kilometres have it on the shelf right now, what each of them charges, and how soon
 * you could have it. Nothing else on the homepage answers the question people actually
 * arrive with.
 *
 * It renders only when at least one nearby pharmacy has real stock. With no data it
 * returns null and the page reads as a shorter, deliberate homepage rather than a
 * marketplace with the lights off — the empty case is handled by the pharmacy section
 * below it, which offers something to do about it.
 */
export async function AvailableNearYou() {
  const location = await getDeliveryLocation()
  const medicines = await findAvailableNearYou(location, { limit: 4, offersPerMedicine: 3 })

  if (medicines.length === 0) return null

  return (
    <section aria-labelledby="near-you-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {/* Only claim proximity once a location has been given — otherwise this is
                simply what is in stock, which is still true and still useful. */}
            <h2
              id="near-you-heading"
              className="home-h2"
            >
              {location ? "Available near you" : "In stock now"}
            </h2>
            <p className="home-meta mt-1">
              {location
                ? `In stock at verified pharmacies around ${locationLabel(location)}, with live prices.`
                : "In stock at verified pharmacies, with live prices. Set your location to see distances and delivery times."}
            </p>
          </div>
          <Link href="/medicines" className="home-link shrink-0">
            View all
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {medicines.map((medicine) => {
            const href = `/medicines/${medicine.slug || medicine.id}`
            const subtitle = [medicine.strength, medicine.pack_size].filter(Boolean).join(" · ")
            const image = medicineImageSrc(medicine.photo_url, medicine.image_url)

            return (
              <article key={medicine.id} className="surface flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted/50">
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="home-h3">
                      <Link href={href} className="hover:text-primary">
                        <span className="line-clamp-2">{medicine.name}</span>
                      </Link>
                    </h3>
                    {subtitle ? <p className="home-meta mt-0.5">{subtitle}</p> : null}
                    <p className="home-meta mt-1">
                      From <span className="price text-base">{formatINR(medicine.best_price)}</span>
                      {" · "}
                      {medicine.offer_count} {medicine.offer_count === 1 ? "pharmacy" : "pharmacies"} near you
                      {medicine.requires_prescription ? " · Rx required" : ""}
                    </p>
                  </div>
                </div>

                <PharmacyOffers offers={medicine.offers} className="mt-3 border-t border-border pt-1" />

                <Link
                  href={href}
                  className="home-link mt-3 inline-flex items-center gap-1"
                >
                  View options
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
