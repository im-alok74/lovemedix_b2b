import Link from "next/link"

import { MedicineCard, type MedicineCardData } from "@/components/medicines/medicine-card"

/**
 * The shared shell for every product section on the homepage.
 *
 * One component instead of the five near-identical heading-plus-grid blocks the page had
 * before, each with slightly different spacing and its own byte-identical `text-xl
 * font-semibold sm:text-2xl` heading. Sections now differ by their data, not their markup.
 *
 * Layout is a horizontal rail below `sm` and a grid above it. Categories deliberately use
 * a grid at every width — they are navigation, and hiding half of them behind a swipe
 * costs real users. Product rails are the opposite case: the pattern is universal in
 * Indian shopping apps, the cards are large, and a partly-visible fourth card is itself
 * the affordance that says "there is more this way".
 */
export function ProductRail({
  id,
  title,
  description,
  href,
  linkLabel = "View all",
  products,
  /** Rails below this many products look like a mistake; the caller gets null instead. */
  minProducts = 3,
  tone = "default",
}: {
  id: string
  title: string
  description?: string
  href?: string
  linkLabel?: string
  products: MedicineCardData[]
  minProducts?: number
  /** `offer` tints the band so a deals rail reads differently from a catalogue rail. */
  tone?: "default" | "offer"
}) {
  if (products.length < minProducts) return null

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={tone === "offer" ? "border-y border-border bg-accent/30 py-8 sm:py-10" : "py-8 sm:py-10"}
    >
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 id={`${id}-heading`} className="home-h2">
              {title}
            </h2>
            {description ? <p className="home-meta mt-1">{description}</p> : null}
          </div>
          {href ? (
            <Link href={href} className="home-link shrink-0">
              {linkLabel}
            </Link>
          ) : null}
        </div>

        {/* `-mx-4 px-4` lets the rail bleed to the screen edge on mobile so the last card
            is not cut off by the container gutter, while the grid stays aligned above sm. */}
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {products.map((product) => (
            <li
              key={product.id}
              className="w-[46vw] min-w-[10.5rem] shrink-0 snap-start sm:w-auto sm:min-w-0"
            >
              <MedicineCard medicine={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
