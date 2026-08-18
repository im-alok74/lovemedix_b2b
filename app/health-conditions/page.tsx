import Link from "next/link"

import { PageShell } from "@/components/page-shell"
import { JsonLd } from "@/components/seo/json-ld"
import { query } from "@/lib/db"
import { buildMetadata, itemListJsonld } from "@/lib/seo"
import { SITE } from "@/lib/site"

export const revalidate = 3600

export const metadata = buildMetadata({
  title: "Shop medicines by health concern",
  description: `Browse medicines by the condition you are treating — diabetes, heart, stomach, pain relief, respiratory and more — on ${SITE.name}.`,
  path: "/health-conditions",
})

interface ConditionRow {
  id: number
  name: string
  slug: string
  description: string | null
  medicine_count: number
}

export default async function HealthConditionsPage() {
  let conditions: ConditionRow[] = []

  try {
    conditions = await query<ConditionRow>`
      SELECT
        hc.id, hc.name, hc.slug, hc.description,
        COUNT(mhc.medicine_id)::int AS medicine_count
      FROM health_conditions hc
      LEFT JOIN medicine_health_conditions mhc ON mhc.condition_id = hc.id
      WHERE hc.is_active
      GROUP BY hc.id
      ORDER BY hc.display_order ASC
    `
  } catch (error) {
    console.error("[health-conditions] load failed:", error)
  }

  return (
    <PageShell
      title="Shop by health concern"
      description="Most people search by the problem, not the brand. Pick a concern to see the medicines used for it."
      crumbs={[{ name: "Health concerns", path: "/health-conditions" }]}
      wide
    >
      {conditions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Health concerns have not been set up yet. Run migration{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">024-production-hardening.sql</code>{" "}
          to populate them.
        </p>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conditions.map((condition) => (
              <li key={condition.id}>
                <Link
                  href={`/health-conditions/${condition.slug}`}
                  className="surface surface-hover block h-full p-4"
                >
                  <h2 className="text-sm font-medium text-foreground">{condition.name}</h2>
                  {condition.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {condition.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {condition.medicine_count > 0
                      ? `${condition.medicine_count} medicine${condition.medicine_count === 1 ? "" : "s"}`
                      : "Browse catalogue"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <JsonLd
            data={itemListJsonld(
              conditions.map((c) => ({ name: c.name, path: `/health-conditions/${c.slug}` })),
              "Health concerns",
            )}
            id="ld-conditions"
          />
        </>
      )}
    </PageShell>
  )
}
