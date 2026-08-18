import Link from "next/link"
import { Building2, PackageSearch, TrendingUp, Truck } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { buildMetadata } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const metadata = buildMetadata({
  title: "Partner with us",
  description: `Sell on ${SITE.name}. Licensed pharmacies and pharmaceutical distributors can reach more customers, manage inventory and handle procurement from one dashboard.`,
  path: "/partner-with-us",
})

const TRACKS = [
  {
    icon: Building2,
    title: "Retail pharmacy",
    body: "List your existing stock, receive orders from customers in your delivery radius, and manage everything from a single dashboard.",
    points: [
      "Bulk-upload inventory from a spreadsheet",
      "Automatic low-stock and expiry alerts",
      "Batch and expiry captured on every sale",
      "GST invoices generated for you",
    ],
    href: "/pharmacy/register",
    cta: "Register your pharmacy",
  },
  {
    icon: Truck,
    title: "Distributor",
    body: "Supply verified pharmacies at scale. Publish your catalogue once and handle procurement requests as they arrive.",
    points: [
      "Bulk catalogue upload with images",
      "Purchase requests with approval workflow",
      "Out-of-stock requests routed to you",
      "Settlement and payment tracking",
    ],
    href: "/distributor/register",
    cta: "Register as distributor",
  },
] as const

const REQUIREMENTS = [
  "A valid drug licence (Form 20/21 for retail, Form 20B/21B for wholesale)",
  "GST registration certificate",
  "A registered pharmacist on record, with their registration number",
  "A bank account in the business name for settlements",
]

export default function PartnerWithUsPage() {
  return (
    <PageShell
      title={`Partner with ${SITE.name}`}
      description="Two ways to work with us, depending on whether you dispense to patients or supply pharmacies."
      crumbs={[{ name: "Partner with us", path: "/partner-with-us" }]}
      wide
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {TRACKS.map((track) => (
          <div key={track.href} className="surface flex flex-col p-6">
            <track.icon className="h-6 w-6 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold text-foreground">{track.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{track.body}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {track.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" asChild>
              <Link href={track.href}>{track.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="surface mt-6 p-6">
        <PackageSearch className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="mt-3 text-base font-semibold text-foreground">What you need to sign up</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We verify every seller before they can list stock. Have these ready:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {REQUIREMENTS.map((requirement) => (
            <li key={requirement} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
              {requirement}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Verification usually completes within two working days. We will email you either way.
        </p>
      </div>

      <div className="surface mt-4 p-6">
        <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="mt-3 text-base font-semibold text-foreground">Commercials</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          There is no listing fee and no monthly subscription. We take a commission on each
          completed order, agreed with you at onboarding and visible in your dashboard. Every
          deduction is itemised on your payout statement — you can reconcile it line by line.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Questions before you sign up? Email{" "}
          <a href={`mailto:${SITE.contact.email}`} className="text-primary underline underline-offset-2">
            {SITE.contact.email}
          </a>
          .
        </p>
      </div>
    </PageShell>
  )
}
