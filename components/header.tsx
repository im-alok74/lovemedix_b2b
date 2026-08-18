import Link from "next/link"
import { FileText, HeartPulse, Newspaper, Pill, Stethoscope, Store, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HeaderCart } from "@/components/header-cart"
import { HeaderSearch } from "@/components/header-search"
import { LocationSelector } from "@/components/location/location-selector"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/user-menu"
import { getCurrentUser } from "@/lib/auth-server"
import { getDeliveryLocation } from "@/lib/location-server"
import { SITE } from "@/lib/site"

/**
 * `icon` is a *name*, not a component: MobileNav is a client component, and functions
 * cannot be serialised across the server/client boundary. It maps the name back to an
 * icon on its side. The desktop nav below renders in this server component, so it can
 * hold the real component in `Icon`.
 */
export const NAV_LINKS: ReadonlyArray<{ href: string; label: string; icon: string; Icon: LucideIcon }> = [
  { href: "/medicines", label: "Medicines", icon: "Pill", Icon: Pill },
  { href: "/pharmacies", label: "Pharmacies", icon: "Store", Icon: Store },
  { href: "/doctors", label: "Doctors", icon: "Stethoscope", Icon: Stethoscope },
  { href: "/health-conditions", label: "Shop by Health", icon: "HeartPulse", Icon: HeartPulse },
  { href: "/upload-prescription", label: "Upload Prescription", icon: "FileText", Icon: FileText },
  { href: "/health-articles", label: "Health Articles", icon: "Newspaper", Icon: Newspaper },
]

export async function Header() {
  // Both reads are request-cached, so adding the location here costs no extra round trip
  // even though several components below also ask for it.
  const [user, location] = await Promise.all([getCurrentUser(), getDeliveryLocation()])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="page-container">
        <div className="flex h-16 items-center gap-3">
          <MobileNav
            links={NAV_LINKS.map(({ href, label, icon }) => ({ href, label, icon }))}
            user={user}
          />

          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${SITE.name} home`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Pill className="h-[18px] w-[18px] text-primary-foreground" aria-hidden />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-base font-semibold tracking-tight text-foreground">{SITE.name}</span>
              <span className="mt-0.5 text-[11px] text-muted-foreground">{SITE.tagline}</span>
            </span>
          </Link>

          {/* Location sits beside the logo because it changes the answer to every
              question the rest of the header asks: what is in stock, at what price, how
              soon. Putting it in a menu would make it invisible. */}
          <LocationSelector location={location} />

          {/* Search is the primary action on a pharmacy — on desktop it takes the centre
              of the bar and all remaining width. Below `lg` there is not enough room for
              a usable search field beside the location chip, so it moves to its own
              full-width row rather than being squeezed to a few characters. */}
          <div className="ml-1 hidden flex-1 lg:ml-6 lg:block">
            <HeaderSearch />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:ml-0">
            {/* The icon still renders for signed-out visitors — /cart bounces them to
                sign-in, which is the right funnel. `signedIn` only gates the count
                fetch, which middleware would answer with a guaranteed 401 otherwise. */}
            {user?.user_type === "customer" || !user ? (
              <HeaderCart signedIn={Boolean(user)} />
            ) : null}

            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile search row. */}
        <div className="pb-2.5 lg:hidden">
          <HeaderSearch />
        </div>
      </div>

      {/* Secondary nav. Hidden on mobile, where MobileNav covers the same links. */}
      <nav
        aria-label="Primary"
        className="hidden border-t border-border/70 lg:block"
      >
        <div className="page-container">
          {/* Primary navigation was set in 14px muted grey, which is the styling this
              design system uses for *secondary* information — captions, hints, metadata.
              Reading as the faintest thing on the screen is the wrong signal for the row
              that carries the whole site. Now 15px semibold in full-strength foreground,
              with the brand teal on hover. */}
          <ul className="flex h-12 items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-foreground transition-colors hover:text-primary"
                >
                  <link.Icon className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <Link
                href="/pharmacy/register"
                className="text-[15px] font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                Sell on {SITE.name}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
