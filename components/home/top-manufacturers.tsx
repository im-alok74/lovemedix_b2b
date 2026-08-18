import Link from "next/link"

import { getTopManufacturers } from "@/lib/catalog"

/**
 * Top manufacturers.
 *
 * Browsing by maker is the third way people look for medicine, after "what am I treating"
 * and "what is it called" — someone told to stay on the same brand of thyroxine is looking
 * for a company, not a category.
 *
 * Every tile is a real `medicines.manufacturer` value with its real product count, so the
 * numbers on screen are the numbers the filtered page will show. There are no brand logo
 * assets in this repo and inventing them would mean shipping other companies' trademarks,
 * so the tiles are typographic: name in heading weight, count underneath. That is also why
 * these are compact — a logo grid would need artwork we do not have.
 */
export async function TopManufacturers() {
  const manufacturers = await getTopManufacturers(12)

  // Below eight this reads as a ragged half-row rather than a section.
  if (manufacturers.length < 8) return null

  return (
    <section aria-labelledby="manufacturers-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="manufacturers-heading" className="home-h2">
              Top manufacturers
            </h2>
            <p className="home-meta mt-1">
              Browse by the company that makes your medicine.
            </p>
          </div>
          <Link href="/medicines" className="home-link shrink-0">
            View all
          </Link>
        </div>

        {/* Denser than four-across: at 1280px four tiles left each name floating in a
            365px box of whitespace, which read as an unfinished grid rather than a brand
            wall. Six across at xl keeps twelve makers to two tidy rows. */}
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {manufacturers.map((maker) => (
            <li key={maker.name}>
              <Link
                href={`/medicines?manufacturer=${encodeURIComponent(maker.name)}`}
                className="surface surface-hover flex h-full flex-col justify-center px-3 py-3.5 text-center"
              >
                <span className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                  {maker.label}
                </span>
                <span className="mt-1 text-sm font-medium text-muted-foreground">
                  {maker.count.toLocaleString("en-IN")} medicines
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
