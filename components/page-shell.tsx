import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/seo/json-ld"
import { breadcrumbJsonld } from "@/lib/seo"

export interface Crumb {
  name: string
  path: string
}

/**
 * Standard page frame: header, breadcrumb, title block, content, footer.
 *
 * Having one shell means breadcrumbs, the h1, and the BreadcrumbList structured data
 * cannot drift apart between pages — and every new page gets correct SEO markup for
 * free rather than by remembering to add it.
 */
export function PageShell({
  title,
  description,
  crumbs = [],
  children,
  wide = false,
  after,
}: {
  title: string
  description?: string
  crumbs?: Crumb[]
  children: React.ReactNode
  wide?: boolean
  /**
   * Full-bleed content rendered after the main container — for banded sections such as
   * support or trust strips that bring their own `.page-container` and background, and
   * would be double-padded if nested inside this one.
   */
  after?: React.ReactNode
}) {
  const trail: Crumb[] = [{ name: "Home", path: "/" }, ...crumbs]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="page-container py-6 sm:py-8">
            {crumbs.length > 0 ? (
              <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {trail.map((crumb, index) => {
                    const isLast = index === trail.length - 1
                    return (
                      <li key={crumb.path} className="flex items-center gap-1">
                        {isLast ? (
                          <span aria-current="page" className="text-foreground">{crumb.name}</span>
                        ) : (
                          <>
                            <Link href={crumb.path} className="hover:text-foreground">
                              {crumb.name}
                            </Link>
                            <ChevronRight className="h-3 w-3" aria-hidden />
                          </>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </nav>
            ) : null}

            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`page-container py-8 sm:py-10 ${wide ? "" : "max-w-3xl"}`}>{children}</div>

        {after}

        {crumbs.length > 0 ? <JsonLd data={breadcrumbJsonld(trail)} id="ld-breadcrumb" /> : null}
      </main>

      <Footer />
    </div>
  )
}

/**
 * Typography wrapper for long-form legal and editorial copy. Tailwind's typography
 * plugin is not installed, so the rules are spelled out here rather than via `prose`.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        text-sm leading-relaxed text-muted-foreground
        [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground
        [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-foreground
        [&_p]:mb-4
        [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5
        [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
        [&_strong]:font-medium [&_strong]:text-foreground
        [&_table]:w-full [&_table]:text-left
        [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:font-medium [&_th]:text-foreground
        [&_td]:border-b [&_td]:border-border [&_td]:py-2
      "
    >
      {children}
    </div>
  )
}
