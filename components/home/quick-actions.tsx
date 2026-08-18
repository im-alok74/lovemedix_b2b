import Link from "next/link"
import { ChevronRight, FlaskConical, Stethoscope, Store, Upload } from "lucide-react"

/**
 * The four things a visitor can do, as a tinted card strip directly under the hero.
 *
 * Each card is a soft colour wash rather than another neutral `.surface` tile — this row
 * sits between the dark band and a long run of white product rails, and without its own
 * colour it disappeared into the page. The chevron is there because on a phone these read
 * as headings unless something says "this goes somewhere".
 *
 * On what these link to: "Doctor Appointment" and "Lab Tests" are shipped ahead of their
 * data — `doctors` and `health_packages` are both empty today, so those two land on pages
 * that show their own empty state. That is a deliberate call to establish the layout now.
 * Neither card claims a number, a price or an availability it cannot back, which is the
 * line that matters: an empty listing is a shop with no stock yet, an invented one is a
 * lie. Nothing here advertises a discount, because no promotion exists in the data.
 */
const ACTIONS = [
  {
    href: "/upload-prescription",
    icon: Upload,
    label: "Upload Prescription",
    hint: "Order from a photo",
    // Tints are set as inline custom properties so each card carries one colour decision
    // in one place, and light/dark both resolve from the same token.
    tint: "bg-[color-mix(in_oklch,var(--success)_12%,var(--card))]",
    iconTint: "text-[color:var(--success)]",
  },
  {
    href: "/doctors",
    icon: Stethoscope,
    label: "Doctor Appointment",
    hint: "Consult a specialist",
    tint: "bg-[color-mix(in_oklch,var(--chart-3)_14%,var(--card))]",
    iconTint: "text-[color:var(--chart-3)]",
  },
  {
    href: "/health-checkups",
    icon: FlaskConical,
    label: "Lab Tests",
    hint: "Book a health check",
    tint: "bg-[color-mix(in_oklch,var(--warning)_16%,var(--card))]",
    iconTint: "text-[color:var(--warning-foreground)]",
  },
  {
    href: "/pharmacies",
    icon: Store,
    label: "Pharmacy Near Me",
    hint: "See who has stock",
    tint: "bg-[color-mix(in_oklch,var(--chart-5)_14%,var(--card))]",
    iconTint: "text-[color:var(--chart-5)]",
  },
] as const

export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="py-6 sm:py-8">
      <div className="page-container">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ACTIONS.map((action) => (
            <li key={action.label}>
              <Link
                href={action.href}
                className={`group flex h-full items-center gap-3 rounded-xl border border-border/60 p-3.5 transition-colors hover:border-foreground/20 sm:p-4 ${action.tint}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/70">
                  <action.icon className={`h-5 w-5 ${action.iconTint}`} aria-hidden />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug text-foreground sm:text-base">
                    {action.label}
                  </span>
                  <span className="home-meta mt-0.5 block">{action.hint}</span>
                </span>

                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
