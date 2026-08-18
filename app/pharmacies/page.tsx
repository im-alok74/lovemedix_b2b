import Link from "next/link"
import { MessageCircle, Phone, Store, Upload } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { PharmacyCard } from "@/components/pharmacies/pharmacy-card"
import { SupportSection } from "@/components/support-section"
import { locationDescription, locationLabel } from "@/lib/location"
import { getDeliveryLocation } from "@/lib/location-server"
import { findNearbyPharmacies } from "@/lib/pharmacies"
import { buildMetadata } from "@/lib/seo"
import { SITE, telUrl, whatsappUrl } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Pharmacies near you",
  description: `Find licensed pharmacies near you on ${SITE.name}. See what each one has in stock, what they charge, and whether they deliver to your area.`,
  path: "/pharmacies",
})

/**
 * Rendered per request: the result depends on the visitor's location cookie, so it can
 * never be shared between two visitors from a static cache.
 */
export const dynamic = "force-dynamic"

export default async function PharmaciesPage() {
  const location = await getDeliveryLocation()
  const pharmacies = await findNearbyPharmacies(location, 48)

  const where = location ? locationLabel(location) : null

  return (
    <PageShell
      wide
      title={where ? `Pharmacies near ${where}` : "Partner pharmacies"}
      description={
        location
          ? `Licensed pharmacies serving ${locationDescription(location)}. Each one sets its own prices and dispenses your order directly.`
          : "Licensed pharmacies on the platform. Set your delivery location in the header to see which of them can reach you, and how quickly."
      }
      crumbs={[{ name: "Pharmacies", path: "/pharmacies" }]}
      after={<SupportSection />}
    >
      {pharmacies.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {/* A real count, whatever it is. Three verified pharmacies stated plainly reads
                better than a vague "many partners across the city". */}
            {pharmacies.length} verified {pharmacies.length === 1 ? "pharmacy" : "pharmacies"}
            {where ? ` near ${where}` : ""}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pharmacies.map((pharmacy) => (
              <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
            ))}
          </div>
        </>
      ) : (
        <div className="surface p-6 sm:p-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
            <Store className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <h2 className="mt-3 text-base font-semibold text-foreground">
            {where ? `No partner pharmacies near ${where} yet` : "No verified pharmacies listed yet"}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            We are signing up pharmacies area by area. In the meantime, send us your prescription
            or the medicine name — we will find a pharmacy that can fulfil it and come back to you
            with a price.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button asChild>
              <Link href="/upload-prescription">
                <Upload className="mr-1.5 h-4 w-4" aria-hidden />
                Upload prescription
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={whatsappUrl(`Hi ${SITE.name}, I need a medicine${where ? ` in ${where}` : ""}.`)}
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
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Know a pharmacy that should be on {SITE.name}?{" "}
            <Link href="/partner-with-us" className="font-medium text-primary hover:underline">
              Suggest it
            </Link>
            .
          </p>
        </div>
      )}
    </PageShell>
  )
}
