import Link from "next/link"
import { MessageCircle, Phone, Store, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PharmacyCard } from "@/components/pharmacies/pharmacy-card"
import { locationLabel } from "@/lib/location"
import { getDeliveryLocation } from "@/lib/location-server"
import { findNearbyPharmacies } from "@/lib/pharmacies"
import { SITE, telUrl, whatsappUrl } from "@/lib/site"

/**
 * Pharmacies near the customer.
 *
 * This section is written for the launch reality: there may be three partner pharmacies,
 * or one, or none in a given area. Showing three is fine — a short honest row reads as a
 * curated local network. What is not fine is padding it out, or rendering a heading over
 * an empty grid.
 *
 * The zero case is the important one. It gets a real section with something to do, so a
 * customer in an uncovered area leaves with a route to their medicine (upload a
 * prescription, call, WhatsApp) instead of the impression that the site is broken.
 */
export async function NearbyPharmacies() {
  const location = await getDeliveryLocation()
  const pharmacies = await findNearbyPharmacies(location, 4)

  const where = location ? ` in ${locationLabel(location)}` : ""

  return (
    <section aria-labelledby="pharmacies-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {/* "Near you" is a claim about distance. Without a location we have not
                measured one, so the heading says what these actually are. */}
            <h2
              id="pharmacies-heading"
              className="home-h2"
            >
              {location ? "Pharmacies near you" : "Our partner pharmacies"}
            </h2>
            <p className="home-meta mt-1">
              {location
                ? "Licensed local pharmacies that stock, price and dispense your order."
                : "Licensed pharmacies on the platform. Set your location in the header to see which of them reach you."}
            </p>
          </div>
          {pharmacies.length > 0 ? (
            <Link href="/pharmacies" className="home-link shrink-0">
              View all
            </Link>
          ) : null}
        </div>

        {pharmacies.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pharmacies.map((pharmacy) => (
              <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
            ))}
          </div>
        ) : (
          <div className="surface p-6 sm:p-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
              <Store className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <h3 className="mt-3 text-lg font-bold text-foreground">
              No {SITE.name} pharmacy partners{where} yet
            </h3>
            <p className="home-body mt-1.5 max-w-xl">
              We are still signing up pharmacies in your area. You can still get your medicines —
              send us your prescription or the medicine name and we will find a pharmacy that can
              fulfil it.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button asChild>
                <Link href="/upload-prescription">
                  <Upload className="mr-1.5 h-4 w-4" aria-hidden />
                  Upload prescription
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={whatsappUrl(`Hi ${SITE.name}, I need help finding a medicine.`)} target="_blank" rel="noopener noreferrer">
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
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Run a pharmacy, or know one that should be here?{" "}
              <Link href="/partner-with-us" className="font-medium text-primary hover:underline">
                Tell us about it
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
