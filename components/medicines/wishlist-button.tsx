"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"

import { useToast } from "@/hooks/use-toast"

/**
 * Wishlist toggle.
 *
 * Optimistic: the heart fills immediately and reverts if the request fails, so the
 * control never feels laggy on a slow connection.
 */
export function WishlistButton({
  medicineId,
  medicineName,
  initiallySaved = false,
}: {
  medicineId: number
  medicineName: string
  initiallySaved?: boolean
}) {
  const [saved, setSaved] = useState(initiallySaved)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function toggle(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (busy) return

    const next = !saved
    setSaved(next)
    setBusy(true)

    try {
      const response = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId }),
      })

      if (response.status === 401) {
        setSaved(!next)
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        router.push(`/signin?redirect=${redirect}`)
        return
      }

      if (!response.ok) throw new Error("request failed")
    } catch {
      setSaved(!next)
      toast({
        title: "Could not update wishlist",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${medicineName} from wishlist` : `Save ${medicineName} to wishlist`}
      className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
      disabled={busy}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`} aria-hidden />
    </button>
  )
}
