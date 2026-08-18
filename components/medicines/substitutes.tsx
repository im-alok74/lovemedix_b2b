import Image from "next/image"
import Link from "next/link"

import { AddToCartButton } from "./add-to-cart-button"
import type { Substitute } from "./medicine-pdp"
import { formatINR } from "@/lib/pricing"
import { medicineImageSrc } from "@/lib/images"

/**
 * Generic / brand substitutes with the same salt composition.
 *
 * This is the single most valuable block on a pharmacy product page: the same molecule
 * at the same strength can differ 5–10x in price between brands, and showing that is the
 * main reason people use an online pharmacy over the chemist downstairs.
 *
 * Comparison is per-unit, not per-pack. A ₹30 strip of 15 and a ₹45 strip of 30 cannot be
 * compared on pack price — doing so would tell the customer the wrong thing.
 */

/** Extracts a unit count from a pack size like "15 tablets" or "strip of 10". */
export function parsePackCount(packSize: string | null | undefined): number | null {
  if (!packSize) return null
  const match = packSize.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const count = Number(match[1])
  return Number.isFinite(count) && count > 0 ? count : null
}

function effectivePrice(item: {
  mrp: string | number
  selling_price?: string | number | null
  discount_percentage?: string | number | null
}): number {
  const list = item.selling_price != null ? Number(item.selling_price) : Number(item.mrp ?? 0)
  const discount = Number(item.discount_percentage ?? 0)
  return discount > 0 ? list - list * (discount / 100) : list
}

export function unitPrice(item: {
  mrp: string | number
  selling_price?: string | number | null
  discount_percentage?: string | number | null
  pack_size?: string | null
}): number | null {
  const count = parsePackCount(item.pack_size)
  if (!count) return null
  return effectivePrice(item) / count
}

export function Substitutes({
  substitutes,
  current,
}: {
  substitutes: Substitute[]
  current: {
    name: string
    mrp: string
    selling_price: string | null
    discount_percentage: string | null
    pack_size: string | null
    salt_composition?: string | null
  }
}) {
  if (substitutes.length === 0) return null

  const currentUnit = unitPrice(current)

  const rows = substitutes
    .map((item) => {
      const unit = unitPrice(item)
      // Percentage saving only means something when both sides have a comparable
      // per-unit price. Otherwise show the price and no claim.
      const savingPct =
        currentUnit && unit && currentUnit > 0 && unit < currentUnit
          ? Math.round(((currentUnit - unit) / currentUnit) * 100)
          : null
      return { item, unit, savingPct }
    })
    .sort((a, b) => {
      if (a.unit == null) return 1
      if (b.unit == null) return -1
      return a.unit - b.unit
    })

  return (
    <section aria-labelledby="substitutes-heading" className="surface p-5">
      <h2 id="substitutes-heading" className="text-base font-semibold text-foreground">
        Cheaper alternatives
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Same composition{current.salt_composition ? ` (${current.salt_composition})` : ""} and
        strength, from a different manufacturer.
      </p>

      <ul className="mt-4 divide-y divide-border">
        {rows.slice(0, 6).map(({ item, unit, savingPct }) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <Link href={`/medicines/${item.slug || item.id}`} className="shrink-0">
              <span className="relative block h-14 w-14 overflow-hidden rounded-md bg-muted/50">
                <Image
                  src={medicineImageSrc(item.photo_url, item.image_url)}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </span>
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/medicines/${item.slug || item.id}`}
                className="line-clamp-1 text-sm font-medium text-foreground hover:text-primary"
              >
                {item.name}
              </Link>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {[item.manufacturer, item.pack_size].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="price text-sm">{formatINR(effectivePrice(item))}</span>
                {unit ? (
                  <span className="text-xs text-muted-foreground">
                    {formatINR(unit)}/unit
                  </span>
                ) : null}
                {savingPct && savingPct > 0 ? (
                  <span className="text-xs font-medium text-[color:var(--success)]">
                    {savingPct}% cheaper
                  </span>
                ) : null}
              </p>
            </div>

            <div className="w-24 shrink-0">
              <AddToCartButton medicineId={item.id} size="sm" label="Add" />
            </div>
          </li>
        ))}
      </ul>

      {/* Substitution is a clinical decision, not a shopping one. Say so. */}
      <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        These contain the same active ingredient at the same strength. Check with your doctor or
        pharmacist before switching brands, particularly for long-term medication.
      </p>
    </section>
  )
}
