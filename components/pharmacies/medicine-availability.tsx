import Link from "next/link"
import { MessageCircle, Phone, Store, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PharmacyOffers } from "@/components/pharmacies/pharmacy-offers"
import { locationLabel } from "@/lib/location"
import { getDeliveryLocation } from "@/lib/location-server"
import { findOffersForMedicine } from "@/lib/pharmacies"
import { formatINR } from "@/lib/pricing"
import { SITE, telUrl, whatsappUrl } from "@/lib/site"

/**
 * Where to buy this specific medicine, near this specific customer.
 *
 * On a marketplace the product page has to answer two questions, not one: "what is this"
 * and "who near me has it, for how much". The second is the one that decides whether an
 * order happens, and it is the one a national catalogue cannot answer.
 *
 * When nobody nearby stocks it, the section stays — it just changes job, from comparison
 * to a route out. Silence there would leave the customer at a dead end on a page that
 * still shows an Add to cart button.
 */
export async function MedicineAvailability({
  medicineId,
  medicineName,
}: {
  medicineId: number
  medicineName: string
}) {
  const location = await getDeliveryLocation()
  const offers = await findOffersForMedicine(medicineId, location, 6)

  const where = location ? locationLabel(location) : null
  const cheapest = offers.length > 0 ? Math.min(...offers.map((offer) => offer.effective_price)) : null

  return (
    <section aria-labelledby="availability-heading" className="surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent">
          <Store className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="availability-heading" className="text-base font-semibold text-foreground">
            {offers.length > 0
              ? where
                ? "Where to buy near you"
                : "Where to buy"
              : where
                ? "Not stocked near you yet"
                : "Not in stock right now"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {offers.length > 0 ? (
              <>
                {offers.length} verified {offers.length === 1 ? "pharmacy" : "pharmacies"}
                {where ? ` near ${where}` : ""} {offers.length === 1 ? "has" : "have"} this in stock
                {cheapest != null ? <>, from <span className="price">{formatINR(cheapest)}</span></> : null}.
              </>
            ) : (
              <>
                No verified pharmacy{where ? ` near ${where}` : ""} has {medicineName} in stock right
                now. Send us the prescription or message us and we will source it from the network.
              </>
            )}
          </p>
        </div>
      </div>

      {offers.length > 0 ? (
        <>
          <PharmacyOffers offers={offers} className="mt-3 border-t border-border pt-1" />
          <p className="mt-3 text-xs text-muted-foreground">
            Prices are set by each pharmacy and can change. Your order is dispensed by the pharmacy
            that fulfils it.
            {!location ? (
              <>
                {" "}
                Set your delivery location in the header to see distances and delivery times.
              </>
            ) : null}
          </p>
        </>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button asChild>
            <Link href="/upload-prescription">
              <Upload className="mr-1.5 h-4 w-4" aria-hidden />
              Upload prescription
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a
              href={whatsappUrl(`Hi ${SITE.name}, I am looking for ${medicineName}.`)}
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
              Call {SITE.contact.phone}
            </a>
          </Button>
        </div>
      )}
    </section>
  )
}
