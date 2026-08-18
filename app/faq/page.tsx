import { PageShell } from "@/components/page-shell"
import { FaqSection } from "@/components/faq-section"
import { JsonLd } from "@/components/seo/json-ld"
import { HOME_FAQS, PHARMACY_FAQS } from "@/lib/faqs"
import { buildMetadata, faqJsonld } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Help & frequently asked questions",
  description: `Answers to common questions about ordering medicines on ${SITE.name} — prescriptions, delivery times, returns, payment methods and generic substitutes.`,
  path: "/faq",
})

const ALL_FAQS = [...HOME_FAQS, ...PHARMACY_FAQS]

export default function FaqPage() {
  return (
    <PageShell
      title="Help & frequently asked questions"
      description={`Everything about ordering, prescriptions, delivery and returns on ${SITE.name}.`}
      crumbs={[{ name: "Help & FAQ", path: "/faq" }]}
      wide
    >
      <FaqSection faqs={HOME_FAQS} title="Ordering & delivery" />
      <FaqSection faqs={PHARMACY_FAQS} title="For pharmacies & distributors" />

      <div className="page-container">
        <div className="surface mx-auto max-w-3xl p-6">
          <h2 className="text-base font-semibold text-foreground">Still need help?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Write to{" "}
            <a href={`mailto:${SITE.contact.email}`} className="text-primary underline underline-offset-2">
              {SITE.contact.email}
            </a>{" "}
            or call{" "}
            <a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`} className="text-primary underline underline-offset-2">
              {SITE.contact.phone}
            </a>
            . For anything about your prescription or dosage, please speak to a registered medical
            practitioner rather than our support team.
          </p>
        </div>
      </div>

      <JsonLd data={faqJsonld(ALL_FAQS)} id="ld-faq-page" />
    </PageShell>
  )
}
