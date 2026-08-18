import { Mail, MapPin, Phone } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { buildMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Contact us",
  description: `Get in touch with ${SITE.name} — customer support, pharmacy partnerships, and our registered office address.`,
  path: "/contact",
})

const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: SITE.contact.email,
    href: `mailto:${SITE.contact.email}`,
    note: "We reply within one working day.",
  },
  {
    icon: Phone,
    label: "Phone",
    value: SITE.contact.phone,
    href: `tel:${SITE.contact.phone.replace(/\s/g, "")}`,
    note: "Monday to Saturday, 9am–8pm IST.",
  },
] as const

export default function ContactPage() {
  return (
    <PageShell
      title="Contact us"
      description="Order help, partnership enquiries, or anything else."
      crumbs={[{ name: "Contact", path: "/contact" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <div key={channel.label} className="surface p-5">
            <channel.icon className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="mt-3 text-sm font-medium text-foreground">{channel.label}</h2>
            <a
              href={channel.href}
              className="mt-1 block text-sm text-primary underline underline-offset-2"
            >
              {channel.value}
            </a>
            <p className="mt-1.5 text-xs text-muted-foreground">{channel.note}</p>
          </div>
        ))}
      </div>

      <div className="surface mt-4 p-5">
        <MapPin className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="mt-3 text-sm font-medium text-foreground">Registered office</h2>
        <address className="mt-1 text-sm not-italic leading-relaxed text-muted-foreground">
          {SITE.legalName}
          <br />
          {SITE.contact.address.street}, {SITE.contact.address.locality}
          <br />
          {SITE.contact.address.region} {SITE.contact.address.postalCode}, India
        </address>
      </div>

      {/* Anything clinical must go to a doctor, not to us. Saying so plainly here
          prevents support having to deflect it case by case. */}
      <div className="mt-6 rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 p-4">
        <h2 className="text-sm font-medium text-foreground">Medical questions</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Our support team cannot advise on dosage, drug interactions, side effects or whether a
          medicine is right for you. Please consult a registered medical practitioner. If this is an
          emergency, contact your nearest hospital immediately.
        </p>
      </div>
    </PageShell>
  )
}
