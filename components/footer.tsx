import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Pill, Twitter } from "lucide-react"

import { SITE } from "@/lib/site"

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { href: "/medicines", label: "All medicines" },
      { href: "/pharmacies", label: "Pharmacies near you" },
      { href: "/doctors", label: "Talk to a doctor" },
      { href: "/health-conditions", label: "Shop by health concern" },
      { href: "/upload-prescription", label: "Upload prescription" },
      { href: "/health-articles", label: "Health articles" },
    ],
  },
  {
    heading: "For business",
    links: [
      { href: "/pharmacy/register", label: "Register as pharmacy" },
      { href: "/distributor/register", label: "Register as distributor" },
      { href: "/partner-with-us", label: "Partner with us" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "Help & FAQ" },
    ],
  },
] as const

const SOCIALS = [
  { href: SITE.social.facebook, label: "Facebook", icon: Facebook },
  { href: SITE.social.twitter, label: "Twitter", icon: Twitter },
  { href: SITE.social.instagram, label: "Instagram", icon: Instagram },
] as const

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="page-container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Pill className="h-[18px] w-[18px] text-primary-foreground" aria-hidden />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-base font-semibold text-foreground">{SITE.name}</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">{SITE.tagline}</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.name} is an online pharmacy marketplace connecting customers to licensed
              pharmacies across India. Medicines are dispensed by verified partner pharmacies
              holding a valid drug licence.
            </p>

            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                  {SITE.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href={`mailto:${SITE.contact.email}`} className="hover:text-foreground">
                  {SITE.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>
                  {SITE.contact.address.street}, {SITE.contact.address.locality},{" "}
                  {SITE.contact.address.region} {SITE.contact.address.postalCode}
                </span>
              </li>
            </ul>

            <ul className="mt-5 flex gap-2">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={`${SITE.name} on ${social.label}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    <social.icon className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-semibold text-foreground">{column.heading}</h2>
              <ul className="mt-3 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Regulatory disclaimer. An online pharmacy needs this on every page, both for
            compliance and because it is what a careful customer looks for. */}
        <p className="mt-10 rounded-md border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">Important:</strong> Medicines listed on{" "}
          {SITE.name} are dispensed only against a valid prescription where the law requires one.
          Information on this site is for general awareness and is not a substitute for professional
          medical advice, diagnosis or treatment. Always consult a registered medical practitioner
          before starting, stopping or changing any medication.
        </p>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {[
              { href: "/privacy", label: "Privacy policy" },
              { href: "/terms", label: "Terms of service" },
              { href: "/refund", label: "Refund policy" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
