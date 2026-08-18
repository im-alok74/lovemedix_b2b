"use client"

import { useEffect, useRef, useState } from "react"

import { AddToCartButton } from "./add-to-cart-button"
import { formatINR } from "@/lib/pricing"

/**
 * Sticky add-to-cart bar for mobile.
 *
 * Both 1mg and Apollo run one, and it is the largest single mobile conversion lever on a
 * product page: once the customer scrolls past the price block into the drug information,
 * the buy action is otherwise a full page-length scroll away.
 *
 * Appears only after the main add-to-cart button has scrolled out of view, so the two are
 * never on screen together competing for the same tap.
 */
export function StickyBuyBar({
  medicineId,
  name,
  price,
  inStock,
  requiresPrescription,
}: {
  medicineId: number
  name: string
  price: number
  inStock: boolean
  requiresPrescription: boolean
}) {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = document.getElementById("pdp-primary-actions")
    if (!target) return

    // IntersectionObserver rather than a scroll listener: no per-frame work on the main
    // thread while the user scrolls.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sentinelRef}>
      <div
        // `bottom-16` clears the mobile bottom navigation, which occupies the same
        // corner. Stacking them rather than hiding one keeps both the primary action and
        // the way out of the page reachable with a thumb.
        className={`fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 p-3 shadow-[0_-1px_3px_rgba(0,0,0,0.06)] backdrop-blur transition-transform duration-200 lg:hidden ${
          visible ? "translate-y-0" : "translate-y-[200%]"
        }`}
        // Hidden from assistive tech and from tab order while off-screen, so keyboard
        // users do not land on an invisible control.
        aria-hidden={!visible}
        {...(!visible ? { inert: "" as unknown as boolean } : {})}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs text-muted-foreground">{name}</p>
            <p className="price text-base">{formatINR(price)}</p>
            {requiresPrescription ? (
              <p className="text-[11px] text-muted-foreground">Prescription required</p>
            ) : null}
          </div>
          <div className="w-36 shrink-0">
            <AddToCartButton
              medicineId={medicineId}
              disabled={!inStock}
              variant="default"
              size="default"
              label="Add to cart"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
