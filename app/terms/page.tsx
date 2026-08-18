import { PageShell, Prose } from "@/components/page-shell"
import { buildMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Terms of service",
  description: `The terms that govern your use of ${SITE.name}, including ordering, prescriptions, pricing and liability.`,
  path: "/terms",
})

const LAST_UPDATED = "8 August 2026"

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of service"
      description={`Last updated ${LAST_UPDATED}`}
      crumbs={[{ name: "Terms of service", path: "/terms" }]}
    >
      <Prose>
        <p>
          These terms govern your use of {SITE.name}, operated by {SITE.legalName}. By creating an
          account or placing an order, you agree to them.
        </p>

        <h2>1. What this service is</h2>
        <p>
          {SITE.name} is a marketplace. We connect you to independent, licensed pharmacies; we do
          not dispense medicines ourselves. The pharmacy that fulfils your order is the seller, and
          it is responsible for the correctness of what it dispenses.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old and legally able to enter a contract. You must give
          accurate details, and you are responsible for everything done under your account. Tell us
          immediately if you think someone else has access to it.
        </p>

        <h2>3. Prescription medicines</h2>
        <ul>
          <li>
            Schedule H, H1 and X medicines are dispensed only against a valid prescription from a
            registered medical practitioner.
          </li>
          <li>
            You must upload a genuine, legible and current prescription. Uploading a forged or
            altered prescription is a criminal offence and will result in account termination.
          </li>
          <li>
            A pharmacist may refuse or reduce any order on clinical or regulatory grounds. That
            decision is final.
          </li>
          <li>We do not dispense narcotic or psychotropic substances through this platform.</li>
        </ul>

        <h2>4. Orders and pricing</h2>
        <ul>
          <li>
            Placing an order is an offer to buy. A contract forms only when the pharmacy accepts and
            confirms it.
          </li>
          <li>
            Prices, discounts and availability are set by each pharmacy and can change. The price
            shown in your cart at checkout is the price that applies to that order.
          </li>
          <li>
            If a genuine pricing error occurs, we may cancel the affected order and refund you in
            full rather than honour it.
          </li>
          <li>
            Delivery is free on orders of ₹{SITE.promise.freeDeliveryAbove} and above; below that a
            flat delivery charge applies. GST is charged at the applicable rate per item.
          </li>
        </ul>

        <h2>5. Delivery</h2>
        <p>
          Delivery windows are estimates, not guarantees. Delays can result from prescription
          verification, stock checks, weather or courier issues. Someone aged 18 or over must be
          available to receive the package.
        </p>

        <h2>6. Cancellations, returns and refunds</h2>
        <p>
          See our <a href="/refund">refund policy</a>, which forms part of these terms. In short:
          you may cancel before dispatch, and you may return wrong, damaged or short-dated items
          within {SITE.promise.returnWindow} of delivery. For safety reasons, opened medicines and
          cold-chain products cannot be returned.
        </p>

        <h2>7. Acceptable use</h2>
        <p>You must not:</p>
        <ul>
          <li>resell medicines bought through this platform;</li>
          <li>submit false prescriptions or impersonate anyone;</li>
          <li>scrape, probe or attempt to disrupt the service;</li>
          <li>use the service for anything unlawful.</li>
        </ul>

        <h2>8. Medical disclaimer</h2>
        <p>
          Content on this site — descriptions, uses, side effects, articles — is general
          information. It is <strong>not</strong> medical advice and must not be used to
          self-diagnose or self-treat. Always consult a registered medical practitioner. In an
          emergency, contact your nearest hospital rather than us.
        </p>

        <h2>9. Liability</h2>
        <p>
          To the extent the law permits, our liability for any order is limited to the amount you
          paid for it. We are not liable for indirect or consequential loss. Nothing here limits
          liability that cannot lawfully be limited, including for death or personal injury caused
          by negligence.
        </p>

        <h2>10. Suspension</h2>
        <p>
          We may suspend or close an account that breaches these terms, submits fraudulent
          prescriptions, or abuses returns and refunds.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of India. Disputes are subject to the exclusive
          jurisdiction of the courts at {SITE.contact.address.locality},{" "}
          {SITE.contact.address.region}.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a>
        </p>
      </Prose>
    </PageShell>
  )
}
