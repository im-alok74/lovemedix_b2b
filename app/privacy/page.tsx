import { PageShell, Prose } from "@/components/page-shell"
import { buildMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Privacy policy",
  description: `How ${SITE.name} collects, uses, stores and protects your personal and health information.`,
  path: "/privacy",
})

const LAST_UPDATED = "8 August 2026"

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy policy"
      description={`Last updated ${LAST_UPDATED}`}
      crumbs={[{ name: "Privacy policy", path: "/privacy" }]}
    >
      <Prose>
        <p>
          This policy explains what {SITE.legalName} (&ldquo;{SITE.name}&rdquo;, &ldquo;we&rdquo;)
          collects when you use this site, why we collect it, and what control you have over it.
          Prescriptions and order history are health information, and we treat them accordingly.
        </p>

        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>Account details</strong> — name, email address, phone number and password
            (stored only as a bcrypt hash, never in readable form).
          </li>
          <li>
            <strong>Delivery details</strong> — the addresses and contact numbers you save for
            orders.
          </li>
          <li>
            <strong>Health information</strong> — prescriptions you upload and the medicines you
            order. This is the most sensitive data we hold.
          </li>
          <li>
            <strong>Transaction records</strong> — orders, invoices and payment status. We do not
            store card numbers, CVVs or UPI credentials; those go directly to the payment gateway.
          </li>
          <li>
            <strong>Technical data</strong> — IP address, browser type and session information,
            used to keep you signed in and to detect abuse.
          </li>
        </ul>

        <h2>2. Why we use it</h2>
        <p>We use your information only to:</p>
        <ul>
          <li>fulfil and deliver your orders, and let you track them;</li>
          <li>allow a licensed pharmacist to verify a prescription before dispensing;</li>
          <li>issue invoices and meet our tax and pharmacy record-keeping obligations;</li>
          <li>provide customer support when you contact us;</li>
          <li>detect fraud, prevent abuse and secure your account.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your data, and we do not use your prescriptions or order
          history to target advertising.
        </p>

        <h2>3. Who we share it with</h2>
        <ul>
          <li>
            <strong>The fulfilling pharmacy</strong> — receives your name, delivery address, phone
            number, order contents and prescription, because it cannot dispense without them.
          </li>
          <li>
            <strong>Delivery partners</strong> — receive only the name, address and phone number
            needed to deliver the package.
          </li>
          <li>
            <strong>Payment gateways</strong> — receive the order amount and reference. They handle
            card and UPI details directly; those never reach our servers.
          </li>
          <li>
            <strong>Authorities</strong> — where we are legally required to disclose, such as a
            valid order from a court or a drug-control authority.
          </li>
        </ul>

        <h2>4. How long we keep it</h2>
        <p>
          Prescription and dispensing records are retained for the period Indian pharmacy
          regulations require. Invoices are retained for the statutory tax period. Everything else
          is deleted or anonymised when you close your account.
        </p>

        <h2>5. How we protect it</h2>
        <p>
          Data is transmitted over HTTPS, passwords are hashed with bcrypt, sessions are stored in
          httpOnly cookies that JavaScript cannot read, and access to prescription images is
          restricted to the customer, the fulfilling pharmacy and authorised staff. No system is
          perfectly secure; if a breach affects you, we will tell you.
        </p>

        <h2>6. Your rights</h2>
        <p>You can ask us to:</p>
        <ul>
          <li>show you a copy of the data we hold about you;</li>
          <li>correct anything inaccurate;</li>
          <li>delete your account and associated data, subject to the retention rules above;</li>
          <li>stop sending you marketing messages, at any time.</li>
        </ul>
        <p>
          Write to <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> and we will
          respond within 30 days.
        </p>

        <h2>7. Cookies</h2>
        <p>
          We use a single essential cookie to keep you signed in. Without it you cannot maintain a
          session. We also use privacy-preserving analytics to count page views; this does not
          track you across other websites.
        </p>

        <h2>8. Children</h2>
        <p>
          This service is not intended for anyone under 18. We do not knowingly create accounts for
          minors. A parent or guardian must place any order on a child&apos;s behalf.
        </p>

        <h2>9. Changes</h2>
        <p>
          If we change this policy materially, we will update the date at the top and notify
          account holders by email before the change takes effect.
        </p>

        <h2>10. Contact</h2>
        <p>
          {SITE.legalName}, {SITE.contact.address.street}, {SITE.contact.address.locality},{" "}
          {SITE.contact.address.region} {SITE.contact.address.postalCode}, India.
          <br />
          Email: <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a> · Phone:{" "}
          <a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`}>{SITE.contact.phone}</a>
        </p>
      </Prose>
    </PageShell>
  )
}
