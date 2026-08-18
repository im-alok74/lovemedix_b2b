import { notFound } from "next/navigation"
import Link from "next/link"

import { PageShell } from "@/components/page-shell"
import { JsonLd } from "@/components/seo/json-ld"
import { MedicineCard, type MedicineCardData } from "@/components/medicines/medicine-card"
import { Button } from "@/components/ui/button"
import { query } from "@/lib/db"
import { buildMetadata, itemListJsonld } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const revalidate = 1800

interface Params {
  params: Promise<{ slug: string }>
}

interface ConditionRow {
  id: number
  name: string
  slug: string
  description: string | null
}

async function getCondition(slug: string): Promise<ConditionRow | null> {
  try {
    const [row] = await query<ConditionRow>`
      SELECT id, name, slug, description
      FROM health_conditions
      WHERE slug = ${slug} AND is_active
      LIMIT 1
    `
    return row ?? null
  } catch (error) {
    console.error("[health-condition] load failed:", error)
    return null
  }
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  const condition = await getCondition(slug)

  // See the PDP for why the 404 has to be raised here rather than in the page body.
  if (!condition) notFound()

  return buildMetadata({
    title: `${condition.name} — medicines online`,
    description:
      condition.description ??
      `Buy medicines for ${condition.name.toLowerCase()} online from verified pharmacies on ${SITE.name}, delivered in ${SITE.promise.deliveryWindow}.`,
    path: `/health-conditions/${condition.slug}`,
    keywords: [
      `${condition.name} medicines`,
      `buy ${condition.name.toLowerCase()} medicine online`,
      `${condition.name} treatment India`,
    ],
  })
}

export default async function HealthConditionPage({ params }: Params) {
  const { slug } = await params
  const condition = await getCondition(slug)

  if (!condition) notFound()

  let medicines: MedicineCardData[] = []
  try {
    medicines = await query<MedicineCardData>`
      SELECT DISTINCT ON (m.id)
        m.id, m.name, m.slug, m.generic_name, m.manufacturer, m.category,
        m.form, m.strength, m.pack_size, m.requires_prescription, m.mrp,
        m.image_url, m.photo_url, m.status,
        pi.selling_price, pi.discount_percentage, pi.stock_quantity,
        pp.pharmacy_name
      FROM medicine_health_conditions mhc
      JOIN medicines m ON m.id = mhc.medicine_id AND m.status = 'active'
      LEFT JOIN pharmacy_inventory pi
        ON pi.medicine_id = m.id AND pi.stock_quantity > 0
      LEFT JOIN pharmacy_profiles pp
        ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
      WHERE mhc.condition_id = ${condition.id}
      ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, pi.selling_price ASC
      LIMIT 48
    `
  } catch (error) {
    console.error("[health-condition] medicines failed:", error)
  }

  return (
    <PageShell
      title={condition.name}
      description={condition.description ?? undefined}
      crumbs={[
        { name: "Health concerns", path: "/health-conditions" },
        { name: condition.name, path: `/health-conditions/${condition.slug}` },
      ]}
      wide
    >
      {medicines.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No medicines are tagged to {condition.name} yet.
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            An admin can tag medicines to this concern from the catalogue. In the meantime, search
            the full catalogue directly.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/medicines">Browse all medicines</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {medicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}
          </div>

          <JsonLd
            data={itemListJsonld(
              medicines.map((m) => ({ name: m.name, path: `/medicines/${m.slug || m.id}` })),
              `Medicines for ${condition.name}`,
            )}
            id="ld-condition-items"
          />
        </>
      )}

      {/* Short explainer under the grid. Gives the page indexable prose instead of a
          bare product wall, which is what makes a category page rank at all. */}
      <section className="mt-10 max-w-3xl">
        <h2 className="text-lg font-semibold text-foreground">
          About {condition.name.toLowerCase()} medicines
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {condition.description ?? `Medicines commonly used in ${condition.name.toLowerCase()}.`}{" "}
          Many of these require a prescription from a registered medical practitioner. {SITE.name}{" "}
          routes your order to a licensed pharmacy that has the item in stock and can deliver to
          your pincode, usually within {SITE.promise.deliveryWindow}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This page is general information, not medical advice. Do not start, stop or change any
          medication for {condition.name.toLowerCase()} without speaking to your doctor.
        </p>
      </section>
    </PageShell>
  )
}
