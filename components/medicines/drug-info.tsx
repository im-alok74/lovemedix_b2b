import { ChevronDown } from "lucide-react"

import { SITE } from "@/lib/site"

/**
 * Drug information accordions.
 *
 * Built on native `<details>` for the same reason as the FAQ block: the answer text is in
 * the initial HTML rather than injected on expand, so a crawler or an AI answer engine
 * that does not execute JavaScript still reads every section.
 *
 * Sections render only when the underlying column has content. An empty "Side effects"
 * accordion on a pharmacy reads as "this medicine has none", which is worse than absent.
 */

export interface DrugInfoFields {
  uses?: string | null
  side_effects?: string | null
  how_to_use?: string | null
  precautions?: string | null
  storage_info?: string | null
  description?: string | null
}

const SECTIONS: Array<{ key: keyof DrugInfoFields; label: string }> = [
  { key: "description", label: "About this medicine" },
  { key: "uses", label: "Uses" },
  { key: "how_to_use", label: "How to use" },
  { key: "side_effects", label: "Side effects" },
  { key: "precautions", label: "Safety advice & precautions" },
  { key: "storage_info", label: "Storage" },
]

export function DrugInfo({ medicine }: { medicine: DrugInfoFields }) {
  const present = SECTIONS.filter((section) => {
    const value = medicine[section.key]
    return typeof value === "string" && value.trim().length > 0
  })

  if (present.length === 0) {
    return (
      <section className="surface p-5">
        <h2 className="text-base font-semibold text-foreground">Product information</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Detailed information for this medicine has not been published yet. Please read the
          package insert supplied with the product, and speak to your doctor or pharmacist
          before use.
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby="drug-info-heading" className="surface p-5">
      <h2 id="drug-info-heading" className="text-base font-semibold text-foreground">
        Product information
      </h2>

      <div className="mt-2 divide-y divide-border">
        {present.map((section, index) => (
          <details key={section.key} className="group py-3" open={index === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <h3 className="text-sm font-medium text-foreground">{section.label}</h3>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {String(medicine[section.key])
                .split(/\n{2,}|\r\n\r\n/)
                .filter((p) => p.trim())
                .map((paragraph, i) => (
                  <p key={i}>{paragraph.trim()}</p>
                ))}
            </div>
          </details>
        ))}
      </div>

      <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        This information is for general awareness only and is not medical advice. {SITE.name} does
        not diagnose conditions or recommend treatment. Always follow your doctor&apos;s
        instructions and the package insert.
      </p>
    </section>
  )
}
