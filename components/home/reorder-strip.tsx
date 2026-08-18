import Link from "next/link"
import Image from "next/image"
import { RotateCcw } from "lucide-react"

import { AddToCartButton } from "@/components/medicines/add-to-cart-button"
import { getCurrentUser } from "@/lib/auth-server"
import { query } from "@/lib/db"
import { formatINR } from "@/lib/pricing"
import { medicineImageSrc } from "@/lib/images"

/**
 * "Buy again" from the customer's delivered orders.
 *
 * Highest-value block on the homepage for anyone on long-term medication: a repeat buyer
 * should not have to search for the same medicine every month. Signed-in customers only,
 * and silent for everyone else.
 */

interface ReorderRow {
  id: number
  name: string
  slug: string | null
  strength: string | null
  pack_size: string | null
  image_url: string | null
  photo_url: string | null
  last_price: string | number
  last_ordered_at: string
  in_stock: boolean
}

export async function ReorderStrip() {
  const user = await getCurrentUser()
  if (!user || user.user_type !== "customer") return null

  let items: ReorderRow[] = []

  try {
    items = await query<ReorderRow>`
      SELECT DISTINCT ON (m.id)
        m.id, m.name, m.slug, m.strength, m.pack_size, m.image_url, m.photo_url,
        oi.unit_price   AS last_price,
        o.created_at    AS last_ordered_at,
        EXISTS (
          SELECT 1 FROM pharmacy_inventory pi
          JOIN pharmacy_profiles pp
            ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
          WHERE pi.medicine_id = m.id AND pi.stock_quantity > 0
        ) AS in_stock
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN medicines m ON m.id = oi.medicine_id AND m.status = 'active'
      WHERE o.customer_id = ${user.id}
        AND o.order_status = 'delivered'
      ORDER BY m.id, o.created_at DESC
      LIMIT 10
    `
  } catch (error) {
    console.error("[reorder-strip] load failed:", error)
    return null
  }

  if (items.length === 0) return null

  return (
    <section aria-labelledby="reorder-heading" className="border-y border-border bg-muted/30 py-8">
      <div className="page-container">
        <div className="mb-4 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="reorder-heading" className="text-lg font-semibold tracking-tight text-foreground">
            Buy again
          </h2>
        </div>

        <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {items.map((item) => (
            <li key={item.id} className="w-44 shrink-0">
              <div className="surface flex h-full flex-col p-3">
                <Link href={`/medicines/${item.slug || item.id}`} className="block">
                  <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-muted/50">
                    <Image
                      src={medicineImageSrc(item.photo_url, item.image_url)}
                      alt=""
                      fill
                      sizes="176px"
                      className="object-contain p-2"
                    />
                  </div>
                  <p className="line-clamp-2 text-sm font-medium text-foreground">{item.name}</p>
                  {item.strength || item.pack_size ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[item.strength, item.pack_size].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </Link>

                <p className="mt-1.5 text-sm text-muted-foreground">
                  Last paid <span className="price text-sm">{formatINR(item.last_price)}</span>
                </p>

                <div className="mt-auto pt-2.5">
                  <AddToCartButton
                    medicineId={item.id}
                    disabled={!item.in_stock}
                    label="Buy again"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
