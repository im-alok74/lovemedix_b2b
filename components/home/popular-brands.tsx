import Image from "next/image"
import Link from "next/link"

import { getBrandTiles } from "@/lib/catalog"

/**
 * Popular brands.
 *
 * Renders nothing today, and that is the correct output rather than a bug.
 *
 * Two reasons, both in the data. 82 of the 92 stocked products come from one
 * manufacturer, so a brand rail would be a single card. And `medicines.manufacturer` has
 * been used as a free-text field — it currently holds values like "CADBE SYRUP (FOOD) 200
 * ML" and "Ursodeoxycholic Acid Suspension", which are product names and dosage forms,
 * not companies. `getBrandTiles` filters those out and then returns nothing at all unless
 * at least four genuine brands each have two photographed products in stock.
 *
 * The section appears by itself once that is true. To make it appear sooner, the fix is
 * upstream: clean the manufacturer column and stock more suppliers — not loosen the
 * threshold here.
 *
 * There are no brand logo files, so each card is built from what does exist: two real
 * pack shots and the brand name set in heading weight.
 */
export async function PopularBrands() {
  const brands = await getBrandTiles({ limit: 10, minProducts: 2, minBrands: 4 })

  if (brands.length === 0) return null

  return (
    <section aria-labelledby="brands-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="brands-heading" className="home-h2">
            Popular brands
          </h2>
          <Link href="/medicines" className="home-link shrink-0">
            View all
          </Link>
        </div>

        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {brands.map((brand) => (
            <li key={brand.key} className="w-44 shrink-0 snap-start sm:w-auto">
              <Link
                href={`/medicines?brand=${encodeURIComponent(brand.key)}`}
                className="surface surface-hover flex h-full flex-col p-3"
              >
                <div className="flex gap-2">
                  {brand.images.map((image, index) => (
                    <div
                      key={`${brand.key}-${index}`}
                      className="relative aspect-square flex-1 overflow-hidden rounded-md bg-muted/40"
                    >
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="90px"
                        className="object-contain p-1.5"
                      />
                    </div>
                  ))}
                </div>
                <p className="home-h3 mt-3 line-clamp-1">{brand.label}</p>
                <p className="home-meta mt-0.5">{brand.count} medicines</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
