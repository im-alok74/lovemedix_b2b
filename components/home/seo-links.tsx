import Link from "next/link"

import { CATEGORY_GROUPS } from "@/lib/categories"
import { getStockedCatalog } from "@/lib/catalog"
import { query } from "@/lib/db"

/**
 * Crawlable internal-link block.
 *
 * This is what a homepage link block is for: a dense, real path from the front page into
 * deep catalogue pages a crawler would otherwise only reach through search. Both 1mg and
 * Apollo run one, and it is a large part of why they own long-tail queries.
 *
 * It previously rendered the raw catalogue, which is why it looked like a database dump:
 *
 *  - The same medicine appeared twice, because duplicate rows exist for one real product
 *    (CADBE DROPS 15 ML is both id 1434 and id 1441) and the query deduplicated by id.
 *  - The "Categories" column printed `medicines.category` verbatim, so visitors saw
 *    "General Medicine" and "General medicine" as separate links, alongside
 *    "Prescription Medicine / General Healthcare" and four different spellings of
 *    "nutritional supplement".
 *  - The "Brands" column printed `medicines.manufacturer` verbatim — a field that has
 *    been used as a free-text dumping ground and contains entries like
 *    "CADBE SYRUP (FOOD) 200 ML", which is a product, not a brand.
 *
 * Now: products come from the deduplicated stocked catalogue, categories come from the
 * curated groups, and the brand column is gone entirely until the manufacturer data is
 * clean enough to be worth showing. Fewer links, all of them real.
 */

interface LinkGroup {
  heading: string
  links: Array<{ label: string; href: string }>
}

/** Links per column. Past this it stops being navigation and goes back to being a dump. */
const PER_COLUMN = 8

export async function SeoLinks() {
  const groups: LinkGroup[] = []

  const catalog = await getStockedCatalog()

  if (catalog.length > 0) {
    // `getStockedCatalog` already collapses duplicate rows by name + strength + pack,
    // so this cannot print the same medicine twice.
    groups.push({
      heading: "Popular medicines",
      links: catalog
        .filter((product) => product.has_image)
        .slice(0, PER_COLUMN)
        .map((product) => ({
          label: product.name,
          href: `/medicines/${product.slug || product.id}`,
        })),
    })

    const counts = new Map<string, number>()
    for (const product of catalog) {
      if (!product.group_key) continue
      counts.set(product.group_key, (counts.get(product.group_key) ?? 0) + 1)
    }

    const categoryLinks = CATEGORY_GROUPS.filter((group) => counts.has(group.key))
      .sort((a, b) => (counts.get(b.key) ?? 0) - (counts.get(a.key) ?? 0))
      .slice(0, PER_COLUMN)
      .map((group) => ({ label: group.label, href: `/medicines?group=${group.key}` }))

    if (categoryLinks.length > 0) {
      groups.push({ heading: "Categories", links: categoryLinks })
    }
  }

  // Health conditions are a separate curated table with clean names, so they are safe to
  // print directly. Wrapped because the table arrives in migration 024.
  try {
    const conditions = await query<{ name: string; slug: string }>`
      SELECT name, slug FROM health_conditions WHERE is_active
      ORDER BY display_order LIMIT ${PER_COLUMN}
    `
    if (conditions.length > 0) {
      groups.push({
        heading: "Health concerns",
        links: conditions.map((condition) => ({
          label: condition.name,
          href: `/health-conditions/${condition.slug}`,
        })),
      })
    }
  } catch (error) {
    console.error("[seo-links] health conditions failed:", error)
  }

  if (groups.length === 0) return null

  return (
    <section aria-labelledby="browse-heading" className="border-t border-border py-10">
      <div className="page-container">
        <h2 id="browse-heading" className="text-base font-bold text-foreground">
          Browse {"Davaa.in"}
        </h2>

        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.heading}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {group.heading}
              </h3>
              <ul className="mt-2.5 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="line-clamp-1 text-[15px] text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
