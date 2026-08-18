import Link from "next/link"
import { MessageCircle, Phone, Search } from "lucide-react"

import { SITE, telUrl, whatsappUrl } from "@/lib/site"

/**
 * Human assistance.
 *
 * The launch audience includes people buying medicines for a parent, people who only know
 * what the strip looks like, and people who would rather talk to someone than fill in a
 * form. For them a phone number in the footer is not support — it is a dead end they never
 * scroll to. So it sits in the page flow, where someone who could not find what they
 * wanted is most likely to give up.
 *
 * Three channels, not four. The prescription-upload tile that used to sit here is gone:
 * WhatsApp does the same job better ("send us a photo" needs no form and no file picker),
 * and it was one of ten prescription calls-to-action competing on a single page. Phone
 * leads, because for the audience this section exists for, it is the one that works.
 *
 * The promise is deliberately narrow — we help you find and order the medicine. It does
 * not offer medical advice, because a pharmacy is not a doctor.
 */
const CHANNELS = [
  {
    icon: Phone,
    title: "Call us",
    body: SITE.contact.phone,
    note: SITE.support.hours,
    href: telUrl(),
    external: true,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp us",
    body: "Send a photo of the strip or prescription",
    note: "Usually replies within the hour",
    href: whatsappUrl(`Hi ${SITE.name}, I need help ordering my medicines.`),
    external: true,
  },
  {
    icon: Search,
    title: "Can't find a medicine?",
    body: "Search by salt, brand or condition",
    note: "Or tell us the name and we will source it",
    href: "/medicines",
    external: false,
  },
] as const

export function SupportSection() {
  return (
    <section aria-labelledby="support-heading" className="border-y border-border bg-muted/40 py-10">
      <div className="page-container">
        <h2 id="support-heading" className="home-h2">
          Need help ordering?
        </h2>
        <p className="home-body mt-1.5 max-w-2xl">
          Call or message us. We will find the medicine for you.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {CHANNELS.map((channel) => {
            const content = (
              <>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background">
                  <channel.icon className="h-6 w-6 text-primary" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold text-foreground">{channel.title}</span>
                  <span className="home-meta mt-0.5 block">{channel.body}</span>
                  <span className="home-meta mt-0.5 block">{channel.note}</span>
                </span>
              </>
            )

            const className = "surface surface-hover flex h-full min-h-28 items-start gap-3 bg-card p-4"

            return (
              <li key={channel.title}>
                {channel.external ? (
                  <a href={channel.href} target="_blank" rel="noopener noreferrer" className={className}>
                    {content}
                  </a>
                ) : (
                  <Link href={channel.href} className={className}>
                    {content}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
