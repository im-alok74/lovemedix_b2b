import Link from "next/link"
import { Clock, MapPin } from "lucide-react"

import { estimateDeliveryWindow, formatDistance } from "@/lib/location"
import { formatINR } from "@/lib/pricing"
import type { PharmacyOffer } from "@/lib/pharmacies"

/**
 * Price comparison across the pharmacies that actually have a medicine in stock.
 *
 * The three things a customer trades off are price, distance and how soon they can have
 * it. Rather than a filter UI, the cheapest and the nearest offer are simply labelled —
 * one glance answers "which of these should I pick", and the labels only appear when
 * there is more than one option to distinguish.
 */

function bestIndexes(offers: PharmacyOffer[]) {
  if (offers.length < 2) return { cheapest: -1, nearest: -1 }

  let cheapest = 0
  offers.forEach((offer, index) => {
    if (offer.effective_price < offers[cheapest].effective_price) cheapest = index
  })

  // Only meaningful when we have real distances for at least two pharmacies.
  let nearest = -1
  offers.forEach((offer, index) => {
    if (offer.distance_km == null) return
    if (nearest === -1 || offer.distance_km < (offers[nearest].distance_km ?? Infinity)) nearest = index
  })
  if (nearest !== -1 && offers.filter((o) => o.distance_km != null).length < 2) nearest = -1

  // A single pharmacy that is both cheapest and nearest only needs one label.
  if (nearest === cheapest) nearest = -1

  return { cheapest, nearest }
}

export function PharmacyOffers({
  offers,
  className = "",
}: {
  offers: PharmacyOffer[]
  className?: string
}) {
  if (offers.length === 0) return null

  const { cheapest, nearest } = bestIndexes(offers)

  return (
    <ul className={`divide-y divide-border ${className}`}>
      {offers.map((offer, index) => {
        const distance = formatDistance(offer.distance_km)
        const eta = offer.delivers_here ? estimateDeliveryWindow(offer.distance_km) : null
        const lowStock = offer.stock_quantity > 0 && offer.stock_quantity <= 5

        return (
          <li key={offer.pharmacy_id} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/pharmacies/${offer.pharmacy_id}`}
                  className="truncate text-base font-bold text-foreground hover:text-primary"
                >
                  {offer.pharmacy_name}
                </Link>
                {index === cheapest ? (
                  <span className="rounded bg-[color:var(--success)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[color:var(--success-foreground)]">
                    Best price
                  </span>
                ) : null}
                {index === nearest ? (
                  <span className="rounded border border-border px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Nearest
                  </span>
                ) : null}
              </div>

              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                {distance ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {distance}
                  </span>
                ) : (
                  <span>{offer.city}</span>
                )}
                {eta ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden />
                    {eta}
                  </span>
                ) : !offer.delivers_here ? (
                  <span>Pickup only</span>
                ) : null}
                {offer.is_open === false ? <span>Closed now</span> : null}
                {lowStock ? (
                  <span className="font-medium text-[color:var(--warning-foreground)]">
                    Only {offer.stock_quantity} left
                  </span>
                ) : null}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="price text-base">{formatINR(offer.effective_price)}</p>
              {offer.discount_percentage > 0 ? (
                <p className="price-strike text-sm">{formatINR(offer.selling_price)}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
