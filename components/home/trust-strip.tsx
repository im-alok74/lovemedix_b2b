import { BadgeCheck, IndianRupee, PackageCheck, Truck } from "lucide-react"

import { SITE } from "@/lib/site"

/**
 * Trust signals, as labels rather than prose.
 *
 * This block used to carry four titles plus four explanatory sentences — 63 words sitting
 * between the visitor and the first product. Nobody reads a paragraph to decide whether a
 * pharmacy is legitimate; they scan for a few concrete claims and move on.
 *
 * So each claim is now four words or fewer, and each is one the platform can actually
 * keep: sellers really are licence-checked, the invoice really does carry batch and
 * expiry, the delivery window and free-delivery threshold are the real configured values.
 * The longer explanations still exist, on /faq, where someone who wants them is looking.
 */
const SIGNALS = [
  { icon: BadgeCheck, label: "Licensed pharmacies only" },
  { icon: PackageCheck, label: "Batch & expiry on the bill" },
  { icon: Truck, label: `Delivery in ${SITE.promise.deliveryWindow}` },
  { icon: IndianRupee, label: `Free above ₹${SITE.promise.freeDeliveryAbove}` },
] as const

export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="border-y border-border bg-muted/40">
      <div className="page-container">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-4 py-5 lg:grid-cols-4">
          {SIGNALS.map((signal) => (
            <li key={signal.label} className="flex items-center gap-2.5">
              <signal.icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
              <span className="text-sm font-bold leading-snug text-foreground sm:text-base">
                {signal.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
