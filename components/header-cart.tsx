"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Cart icon with a live item count.
 *
 * `signedIn` is not cosmetic. /api/cart is behind a `customer`-role middleware guard, so
 * calling it while signed out is a request whose only possible outcome is 401 — it used to
 * fire on every anonymous page view and fill the console with failures that looked like
 * real breakage. A signed-out visitor has no server-side cart to count, so the badge is
 * simply zero and no request is made.
 */
export function HeaderCart({ signedIn = false }: { signedIn?: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!signedIn) {
      setCount(0)
      return
    }

    let mounted = true

    async function loadCount() {
      try {
        const response = await fetch("/api/cart")
        if (!response.ok) {
          if (mounted) setCount(0)
          return
        }

        const data = await response.json()
        if (mounted) {
          setCount(Array.isArray(data?.cartItems) ? data.cartItems.length : 0)
        }
      } catch {
        if (mounted) setCount(0)
      }
    }

    loadCount()
    return () => {
      mounted = false
    }
  }, [signedIn])

  return (
    <Button variant="ghost" size="icon" asChild className="relative rounded-full">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count}
          </span>
        ) : null}
        <span className="sr-only">Shopping Cart</span>
      </Link>
    </Button>
  )
}
