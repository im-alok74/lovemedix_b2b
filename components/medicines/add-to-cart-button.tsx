"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface AddToCartButtonProps {
  medicineId: number
  quantity?: number
  disabled?: boolean
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "default" | "lg"
  className?: string
  label?: string
}

export function AddToCartButton({
  medicineId,
  quantity = 1,
  disabled = false,
  variant = "outline",
  size = "sm",
  className,
  label = "Add to cart",
}: AddToCartButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [isRefreshing, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  async function handleAddToCart() {
    setIsSaving(true)

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId, quantity }),
      })

      if (response.status === 401) {
        // Come back to this page after signing in rather than dumping them on /.
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        router.push(`/signin?redirect=${next}`)
        return
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast({
          title: "Could not add to cart",
          description: data.error || "Please try again.",
          variant: "destructive",
        })
        return
      }

      // Brief inline confirmation reads better than a toast for a repeated micro-action.
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
      startTransition(() => router.refresh())
    } catch {
      toast({
        title: "Network error",
        description: "Check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const busy = isSaving || isRefreshing

  return (
    <Button
      type="button"
      onClick={handleAddToCart}
      disabled={disabled || busy}
      variant={justAdded ? "secondary" : variant}
      size={size}
      className={className ?? "w-full"}
      aria-live="polite"
    >
      {busy ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
          Adding…
        </>
      ) : justAdded ? (
        <>
          <Check className="mr-1.5 h-4 w-4" aria-hidden />
          Added
        </>
      ) : disabled ? (
        "Out of stock"
      ) : (
        <>
          <ShoppingCart className="mr-1.5 h-4 w-4" aria-hidden />
          {label}
        </>
      )}
    </Button>
  )
}
