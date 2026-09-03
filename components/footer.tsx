import Link from "next/link"
import { Linkedin, Mail, MapPin, Phone, Pill } from "lucide-react"

import { SITE, telUrl } from "@/lib/site"

const COLUMNS = [
  {
    heading: "Platform",
    links: [
      { href: "/pharmacy/register", label: "Register your pharmacy" },
      { href: "/distributor/register", label: "Become a distributor" },
      { href: "/signin", label: "Sign in" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/", label: "About Lovemedix" },
      { href: `mailto:${SITE.contact.email}`, label: "Contact" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="page-container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Pill className="h-[18px] w-[18px] text-primary-foreground" aria-hidden />
              </span>
              <span className="text-base font-semibold tracking-tight">{SITE.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{SITE.description}</p>
            <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <a href={`mailto:${SITE.contact.email}`} className="flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4" aria-hidden /> {SITE.contact.email}
              </a>
              <a href={telUrl()} className="flex items-center gap-2 hover:text-foreground">
                <Phone className="h-4 w-4" aria-hidden /> {SITE.contact.phone}
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden /> {SITE.contact.address.locality}, {SITE.contact.address.region}
              </p>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-foreground">{column.heading}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-foreground">Follow</h3>
            <a
              href={SITE.social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" aria-hidden /> LinkedIn
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITE.legalName}. All rights reserved. For registered
          pharmacies and licensed distributors only.
        </div>
      </div>
    </footer>
  )
}
