import Link from "next/link"

import { PageShell, Prose } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { buildMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  title: "About us",
  description: `${SITE.name} is an online pharmacy marketplace connecting customers across India to licensed, verified pharmacies for genuine medicines delivered to their door.`,
  path: "/about",
})

export default function AboutPage() {
  return (
    <PageShell
      title={`About ${SITE.name}`}
      description="Who we are, how the marketplace works, and what we hold ourselves to."
      crumbs={[{ name: "About us", path: "/about" }]}
    >
      <Prose>
        <p>
          {SITE.name} is an online pharmacy marketplace operated by {SITE.legalName}. We connect
          people who need medicines to pharmacies that are licensed to dispense them. We do not
          manufacture or hold stock ourselves — every order is fulfilled by a partner pharmacy
          holding a valid drug licence, verified by our team before it can list anything.
        </p>

        <h2>How the marketplace works</h2>
        <ol>
          <li>
            <strong>You search or upload.</strong> Find a medicine by brand or salt name, or upload
            a photo of your prescription and let a pharmacist read it.
          </li>
          <li>
            <strong>We route the order.</strong> Your cart is matched to the verified pharmacy that
            has the item in stock at the best price and can reach your pincode.
          </li>
          <li>
            <strong>The pharmacy dispenses it.</strong> A licensed pharmacist checks the
            prescription where one is required, packs the order, and records the batch and expiry
            of the exact pack you receive.
          </li>
          <li>
            <strong>You get it delivered.</strong> Usually within {SITE.promise.deliveryWindow},
            with an invoice that shows batch number, manufacturing date, expiry date and GST.
          </li>
        </ol>

        <h2>What we commit to</h2>
        <ul>
          <li>
            <strong>Only licensed sellers.</strong> Drug licence and GST details are checked before
            a pharmacy or distributor is approved, and licence expiry is tracked.
          </li>
          <li>
            <strong>Traceable stock.</strong> Batch number and expiry date are recorded at the point
            of sale and printed on the invoice, so any pack can be traced back to its manufacturer.
          </li>
          <li>
            <strong>Honest pricing.</strong> The price you see is the price you pay. Delivery
            charges and GST are itemised in the cart before you commit.
          </li>
          <li>
            <strong>No invented signals.</strong> Ratings shown on a product come from customers who
            actually bought it. If a medicine has no reviews, we show no rating.
          </li>
        </ul>

        <h2>What we are not</h2>
        <p>
          {SITE.name} is not a substitute for medical care. We do not diagnose conditions, recommend
          treatments, or advise on dosage. Prescription medicines are dispensed only against a valid
          prescription from a registered medical practitioner. If you are unsure about a medicine,
          speak to your doctor or pharmacist.
        </p>

        <h2>Talk to us</h2>
        <p>
          Email <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> or call{" "}
          <a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`}>{SITE.contact.phone}</a>. Our
          registered address is {SITE.contact.address.street}, {SITE.contact.address.locality},{" "}
          {SITE.contact.address.region} {SITE.contact.address.postalCode}, India.
        </p>
      </Prose>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/medicines">Browse medicines</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/pharmacy/register">Register your pharmacy</Link>
        </Button>
      </div>
    </PageShell>
  )
}
