"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Pill, Store, Package, User, type LucideIcon } from "lucide-react"

/**
 * Mobile bottom navigation.
 *
 * Mobile is the primary surface, and on a phone the header is at the top of a long
 * scroll while the thumb rests at the bottom. These five destinations cover almost every
 * session, each as a full-height tap target well above the 44px minimum.
 *
 * Five items, not eight. Doctors are deliberately not one of them: consultations have no
 * partner doctors at launch, and spending one of five permanent slots on a page that
 * cannot yet answer anything is worse than reaching it from the homepage. It moves in
 * when there are doctors to show.
 */
const ITEMS: ReadonlyArray<{ href: string; label: string; Icon: LucideIcon }> = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/medicines", label: "Medicines", Icon: Pill },
  { href: "/pharmacies", label: "Pharmacies", Icon: Store },
  { href: "/orders", label: "Orders", Icon: Package },
  { href: "/dashboard", label: "Account", Icon: User },
]

/**
 * Surfaces that own their full viewport. Seller and admin consoles have their own
 * navigation, and checkout should not offer four ways to abandon the payment.
 */
const HIDDEN_PREFIXES = ["/admin", "/pharmacy", "/distributor", "/checkout", "/signin", "/signup"]

export function BottomNav() {
  const pathname = usePathname()

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null
  }

  return (
    <>
      {/* Spacer so the last of the page content is never trapped under the bar. */}
      <div className="h-16 lg:hidden" aria-hidden />

      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 px-0.5 text-[11px] transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {/* At 320px each cell is 64px wide; "Pharmacies" only just fits, so it
                      truncates rather than wrapping the bar to two lines. */}
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
