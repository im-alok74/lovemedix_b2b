import { ProductRail } from "@/components/home/product-rail"
import { getBestValue, getThemedRails } from "@/lib/catalog"

/**
 * Best value today.
 *
 * "Best value" is measured against MRP, not against the pharmacy's own list price, and
 * anything with no real saving is excluded in `getBestValue` before it reaches this
 * component. That distinction is the whole difference between a deals rail and a normal
 * product grid wearing a discount badge — and on a pharmacy, a "50% off" label over a
 * price that is not actually below MRP is the kind of thing that ends in a refund and a
 * lost customer.
 */
export async function BestValue() {
  const products = await getBestValue(8)

  return (
    <ProductRail
      id="best-value"
      tone="offer"
      title="Best value today"
      description="Real savings against MRP, in stock right now"
      href="/medicines"
      products={products}
      minProducts={4}
    />
  )
}

/**
 * Category rails, chosen by what is actually stocked.
 *
 * The sections are not hardcoded. Ayurveda & Herbal, Skin & Hair and Diabetes Care are
 * all defined in `CATEGORY_GROUPS` and will appear here on their own the day a pharmacy
 * stocks four photographed products in one of them. Today the shelves that qualify are
 * Antibiotics, Vitamins & Nutrition and Pain Relief — so those are what renders.
 *
 * Writing the section list by hand would mean shipping "Ayurveda" as an empty heading and
 * then hand-editing this file every time inventory changes. This way the homepage tracks
 * the warehouse by itself.
 */
export async function ThemedRails() {
  // Deals already lead with the deepest discounts; excluding nothing here would often
  // repeat the same four packs two sections apart.
  const rails = await getThemedRails({ limit: 3, minProducts: 4, productsPerRail: 8 })

  if (rails.length === 0) return null

  return (
    <>
      {rails.map((rail) => (
        <ProductRail
          key={rail.key}
          id={`rail-${rail.key}`}
          title={rail.label}
          href={`/medicines?group=${rail.key}`}
          products={rail.products}
          minProducts={4}
        />
      ))}
    </>
  )
}
