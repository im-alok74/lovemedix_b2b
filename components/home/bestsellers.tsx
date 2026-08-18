import Link from "next/link"

import { MedicineCard, type MedicineCardData } from "@/components/medicines/medicine-card"
import { cachedPublic, TAGS, TTL } from "@/lib/cache"
import { query } from "@/lib/db"

/**
 * Most-ordered medicines, computed from real `order_items` rows.
 *
 * Renders nothing when there is not enough order history to be meaningful. A "bestsellers"
 * rail on a platform with four orders is not social proof, it is noise — and inventing the
 * ranking would breach the no-invented-data rule.
 */

/** Below this many distinct orders, the ranking is not worth showing. */
const MIN_ORDERS_TO_SHOW = 10

/**
 * Extracted from the component so the result can be cached across requests.
 *
 * This is two aggregate queries over `orders`/`order_items` — a COUNT over all orders and
 * a 90-day GROUP BY — and the answer is identical for every visitor. Uncached it ran twice
 * per homepage view, per user.
 */
async function loadBestsellers(): Promise<MedicineCardData[] | null> {
  let medicines: MedicineCardData[] = []

  try {
    const [{ total } = { total: 0 }] = await query<{ total: number }>`
      SELECT COUNT(*)::int AS total FROM orders WHERE order_status <> 'cancelled'
    `

    if (Number(total) < MIN_ORDERS_TO_SHOW) return null

    medicines = await query<MedicineCardData>`
      WITH ranked AS (
        SELECT oi.medicine_id, COUNT(DISTINCT oi.order_id)::int AS order_count
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id AND o.order_status <> 'cancelled'
        -- Recent demand, not all-time. A medicine that sold well a year ago is not a
        -- bestseller today.
        WHERE o.created_at > NOW() - INTERVAL '90 days'
        GROUP BY oi.medicine_id
        ORDER BY order_count DESC
        LIMIT 12
      )
      SELECT DISTINCT ON (m.id)
        m.id, m.name, m.slug, m.generic_name, m.manufacturer, m.category,
        m.form, m.strength, m.pack_size, m.requires_prescription, m.mrp,
        m.image_url, m.photo_url, m.status,
        pi.selling_price, pi.discount_percentage, pi.stock_quantity,
        pp.pharmacy_name
      FROM ranked r
      JOIN medicines m ON m.id = r.medicine_id AND m.status = 'active'
      JOIN pharmacy_inventory pi
        ON pi.medicine_id = m.id AND pi.stock_quantity > 0
      JOIN pharmacy_profiles pp
        ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
      ORDER BY m.id, pi.selling_price ASC
    `
  } catch (error) {
    console.error("[bestsellers] load failed:", error)
    return null
  }

  return medicines
}

/**
 * Cached for the catalogue window. Order history is public, aggregate and non-personalised,
 * so one query per window serves every visitor.
 */
const getBestsellers = cachedPublic(loadBestsellers, ["bestsellers-90d"], {
  revalidate: TTL.CATALOG,
  tags: [TAGS.catalog, TAGS.inventory],
})

export async function Bestsellers() {
  const medicines = await getBestsellers()

  if (!medicines || medicines.length < 4) return null

  return (
    <section aria-labelledby="bestsellers-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="bestsellers-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Most ordered
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What customers have bought most over the last 90 days.
            </p>
          </div>
          <Link href="/medicines" className="shrink-0 text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {medicines.slice(0, 6).map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} />
          ))}
        </div>
      </div>
    </section>
  )
}
