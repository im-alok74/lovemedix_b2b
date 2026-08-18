import type { Metadata } from "next"
import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

/**
 * Global noindex for every not-found response.
 *
 * This matters more than it looks. Next 16 cannot set a 404 status line once a dynamic
 * page has begun streaming, so `notFound()` from inside a page renders this component
 * with HTTP 200 — a "soft 404". Without an explicit noindex, search engines would treat
 * those as real, indexable pages, and a catalogue with thousands of dead product URLs
 * would fill the index with duplicate empty pages.
 *
 * Declaring it here covers every notFound() call site at once, rather than relying on
 * each page remembering to pass `noIndex` in its own metadata.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
}

/**
 * 404 page.
 *
 * There was no custom not-found route, so every dead link fell through to Next's default
 * black-and-white screen with no header, no search and no way back into the catalogue.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <FileQuestion className="h-6 w-6 text-primary" aria-hidden />
          </span>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The link may be broken, or the medicine may no longer be listed. Try searching for it
            instead — the search box at the top covers the whole catalogue.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/medicines">Browse medicines</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go home</Link>
            </Button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Looking for something specific?{" "}
            <Link href="/upload-prescription" className="text-primary hover:underline">
              Upload your prescription
            </Link>{" "}
            and a pharmacist will find it for you.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
