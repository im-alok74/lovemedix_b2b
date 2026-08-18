import Image from "next/image"
import Link from "next/link"

import { getCategoryTiles } from "@/lib/catalog"

/**
 * Shop by category — the page's main navigation, and its first block of photography.
 *
 * It replaces a horizontal strip of 20px line icons in 40px circles. Two problems with
 * that: a stroke icon at 20px is unreadable at arm's length on a 720p screen, and a
 * horizontal scroller hides more than half the categories behind a gesture that a lot of
 * first-time smartphone users never discover.
 *
 * So: a grid, not a rail — every category visible without scrolling sideways — and each
 * tile carries a real photograph of something actually on that shelf, pulled from live
 * inventory. A category with no photographed stock is dropped rather than illustrated
 * with a placeholder.
 */
export async function CategoryTiles() {
  const tiles = await getCategoryTiles(8)

  // Under four tiles this reads as a broken grid rather than a section. The rest of the
  // page carries navigation, so showing nothing is the better failure.
  if (tiles.length < 4) return null

  return (
    <section aria-labelledby="categories-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="categories-heading" className="home-h2">
            Shop by category
          </h2>
          <Link href="/medicines" className="home-link shrink-0">
            View all
          </Link>
        </div>

        {/* Compact tiles, eight across on desktop.
            The previous grid was four across with a full-bleed square photograph filling
            each tile — roughly 300px tall apiece, so eight categories ate two full screens
            of scroll on a phone and the section read as a product grid rather than as
            navigation. These are nav chips: a small pack shot for recognition, the label,
            the count, and a whole row visible at once. */}
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {tiles.map((tile) => (
            <li key={tile.key}>
              <Link
                href={`/medicines?group=${tile.key}`}
                className="surface surface-hover flex h-full flex-col items-center gap-2 p-2.5 text-center"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted/50">
                  <Image
                    src={tile.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-contain p-1.5"
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                    {tile.label}
                  </p>
                  <p className="home-meta mt-0.5">{tile.count}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
