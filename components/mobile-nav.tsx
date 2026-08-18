"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, HeartPulse, Menu, Newspaper, Pill, Stethoscope, Store, X, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SITE } from "@/lib/site"
import type { User } from "@/lib/types"

/**
 * Icons are resolved here rather than passed in as props.
 *
 * React components are functions, and functions cannot cross the server/client boundary
 * — passing the icon down from the server-rendered Header fails the build with
 * "Functions cannot be passed directly to Client Components". The Header sends plain
 * serialisable data (href, label, icon *name*) and this map turns the name back into a
 * component on the client.
 */
const ICONS: Record<string, LucideIcon> = {
  Pill,
  Store,
  Stethoscope,
  HeartPulse,
  FileText,
  Newspaper,
}

export interface NavLink {
  href: string
  label: string
  /** Key into ICONS above — a string, not a component. */
  icon: string
}

/**
 * Mobile navigation drawer.
 *
 * Replaces the previous `<details>/<summary>` dropdown, which had no focus management,
 * did not close on navigation, and could not be dismissed with Escape.
 */
export function MobileNav({
  links,
  user,
}: {
  links: readonly NavLink[]
  user: User | null
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Any navigation closes the drawer.
  useEffect(() => setOpen(false), [pathname])

  // Lock body scroll and wire up Escape while the drawer is open.
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-background shadow-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <span className="font-semibold text-foreground">{SITE.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2" aria-label="Mobile">
              <ul className="space-y-0.5">
                {links.map((link) => {
                  const Icon = ICONS[link.icon] ?? Pill
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                          pathname === link.href
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="my-3 border-t border-border" />

              <ul className="space-y-0.5">
                <li>
                  <Link href="/pharmacy/register" className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">
                    Register as pharmacy
                  </Link>
                </li>
                <li>
                  <Link href="/distributor/register" className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">
                    Register as distributor
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">
                    Help &amp; FAQ
                  </Link>
                </li>
              </ul>
            </nav>

            {!user ? (
              <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
                <Button variant="outline" asChild>
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
