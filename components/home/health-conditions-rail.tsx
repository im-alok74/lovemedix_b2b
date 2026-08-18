import Link from "next/link"
import {
  Accessibility, Activity, Baby, Bandage, Bone, Brain, Droplet, Eye, Filter,
  Flower2, Heart, HeartPulse, Soup, Sparkles, Thermometer, Wind, type LucideIcon,
} from "lucide-react"

/**
 * "Shop by health concern" — the navigation pattern both 1mg and Apollo lead with,
 * because most people search by problem ("acidity", "blood pressure") rather than by
 * brand name. Also gives us a set of indexable landing pages per condition.
 */

const ICONS: Record<string, LucideIcon> = {
  Droplet, HeartPulse, Soup, Bandage, Thermometer, Activity, Wind, Sparkles,
  Bone, Filter, Eye, Flower2, Baby, Accessibility, Heart, Brain,
}

export interface HealthCondition {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
}

export function HealthConditionsRail({ conditions }: { conditions: HealthCondition[] }) {
  if (conditions.length === 0) return null

  return (
    <section aria-labelledby="shop-by-health" className="py-10 sm:py-12">
      <div className="page-container">
        {/* Same heading treatment as every other homepage section. This one used to be a
            one-off `text-xl sm:text-2xl`, which rendered at 24px against the 30px
            `home-h2` used everywhere else — so the page had two heading sizes with no rule
            behind which section got which. */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="shop-by-health" className="home-h2">
              Shop by health concern
            </h2>
            <p className="home-meta mt-1">
              Find the right medicines for what you are treating.
            </p>
          </div>
          <Link href="/health-conditions" className="home-link shrink-0">
            View all
          </Link>
        </div>

        {/* Wider tiles with the icon beside the label rather than stacked above it.
            Eight-across at 40px icons made every tile a small square of grey text, and
            "Respiratory Care" wrapped to three lines inside it. Five across gives each
            row enough width for the longest condition name on one or two lines, and the
            larger tinted icon is what makes the row scannable at a glance. */}
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {conditions.slice(0, 15).map((condition) => {
            const Icon = ICONS[condition.icon ?? ""] ?? Activity
            return (
              <li key={condition.id}>
                <Link
                  href={`/health-conditions/${condition.slug}`}
                  className="surface surface-hover flex h-full items-center gap-3 p-3 sm:p-3.5"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                    <Icon className="h-6 w-6 text-primary" aria-hidden />
                  </span>
                  <span className="min-w-0 text-sm font-bold leading-snug text-foreground">
                    {condition.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
