import Link from "next/link"
import { BadgeCheck, Clock, MapPin, Store } from "lucide-react"

import { estimateDeliveryWindow, formatDistance } from "@/lib/location"
import type { PharmacySummary } from "@/lib/pharmacies"

/**
 * Pharmacy tile.
 *
 * Every field is conditional on real data existing. A pharmacy that has not published
 * opening hours shows no open/closed pill; one with no coordinates shows no distance.
 * The alternative — filling gaps with plausible defaults — teaches customers that the
 * information on this page cannot be trusted, which is expensive to undo.
 *
 * There is no rating here. `reviews` rows exist in the schema but nothing writes them
 * yet, so a star would be invented. It goes in when it is real.
 */
export function PharmacyCard({ pharmacy }: { pharmacy: PharmacySummary }) {
  const distance = formatDistance(pharmacy.distance_km)
  const eta = pharmacy.delivers_here ? estimateDeliveryWindow(pharmacy.distance_km) : null

  return (
    <article className="surface surface-hover relative flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent">
          <Store className="h-5 w-5 text-primary" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-foreground">
            <Link href={`/pharmacies/${pharmacy.id}`} className="after:absolute after:inset-0 hover:text-primary">
              <span className="line-clamp-2">{pharmacy.pharmacy_name}</span>
            </Link>
          </h3>

          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {distance ? `${distance} · ` : ""}
              {pharmacy.city}
            </span>
          </p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
        <li className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-medium text-muted-foreground">
          <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
          Davaa verified
        </li>

        {pharmacy.is_24x7 ? (
          <li className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-[color:var(--success)]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Open 24×7
          </li>
        ) : pharmacy.is_open === true ? (
          <li className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-[color:var(--success)]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Open now
            {pharmacy.closing_time ? <span className="font-normal text-muted-foreground">till {pharmacy.closing_time}</span> : null}
          </li>
        ) : pharmacy.is_open === false ? (
          <li className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Closed
            {pharmacy.opening_time ? <span className="font-normal">· opens {pharmacy.opening_time}</span> : null}
          </li>
        ) : null}
      </ul>

      <div className="mt-auto pt-3 text-sm text-muted-foreground">
        {pharmacy.in_stock_count > 0 ? (
          <p>
            <span className="font-medium text-foreground">{pharmacy.in_stock_count}</span>{" "}
            {pharmacy.in_stock_count === 1 ? "medicine" : "medicines"} in stock
          </p>
        ) : (
          <p>Stock list is being updated</p>
        )}

        <p className="mt-0.5">
          {pharmacy.delivers_here
            ? `Delivery available${eta ? ` · ${eta}` : ""}`
            : "Pickup from store"}
        </p>
      </div>
    </article>
  )
}
