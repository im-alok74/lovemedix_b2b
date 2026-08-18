"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Crosshair, Loader2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SUGGESTED_CITIES,
  locationDescription,
  locationLabel,
  type DeliveryLocation,
} from "@/lib/location"

/**
 * Delivery-location picker.
 *
 * Three ways in, in the order people actually use them: share device location (one tap,
 * most accurate), type a pincode (works on a shared or borrowed phone, and is what most
 * people know by heart), or pick a city (works when someone is ordering for a parent in
 * another town).
 *
 * Deliberately *not* an onboarding gate. A visitor can browse the whole catalogue with
 * no location set; we only ask when knowing where they are makes the answer better.
 */

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string }

export function LocationSelector({ location }: { location: DeliveryLocation | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pincode, setPincode] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  const busy = status.kind === "busy" || isPending

  async function save(body: Record<string, unknown>) {
    setStatus({ kind: "busy" })
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus({ kind: "error", message: data.error ?? "Could not save that location." })
        return
      }

      setStatus({ kind: "idle" })
      setOpen(false)
      setPincode("")
      // Every server-rendered surface reads the cookie, so a refresh re-renders nearby
      // pharmacies, availability and delivery estimates in one pass.
      startTransition(() => router.refresh())
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." })
    }
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus({ kind: "error", message: "This browser cannot share your location. Enter a pincode instead." })
      return
    }

    setStatus({ kind: "busy" })
    navigator.geolocation.getCurrentPosition(
      (position) =>
        void save({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }),
      () =>
        setStatus({
          kind: "error",
          message: "Location access was blocked. Enter your pincode instead.",
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }

  const description = locationDescription(location)

  return (
    <>
      {/* min-w-0 lets the chip shrink instead of pushing the cart off the row at 320px;
          the label truncates rather than overflowing. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 min-w-0 max-w-30 items-center gap-1.5 rounded-md px-1.5 text-left transition-colors hover:bg-muted sm:max-w-44 sm:px-2.5"
        aria-label={location ? `Delivery location: ${description}. Change it.` : "Set your delivery location"}
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 leading-tight">
          <span className="hidden text-[11px] text-muted-foreground sm:block">
            {location ? "Deliver to" : "Where are you?"}
          </span>
          <span className="block truncate text-sm font-medium text-foreground">
            {locationLabel(location)}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setStatus({ kind: "idle" }) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Where should we deliver?</DialogTitle>
            <DialogDescription>
              Medicine stock, prices and delivery times are different in every area. Telling us
              where you are shows you what is genuinely available near you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-start"
              onClick={useCurrentLocation}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Crosshair className="mr-2 h-4 w-4 text-primary" aria-hidden />
              )}
              Use my current location
            </Button>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (!/^[1-9]\d{5}$/.test(pincode)) {
                  setStatus({ kind: "error", message: "Enter a valid 6-digit pincode." })
                  return
                }
                void save({ pincode })
              }}
            >
              <label htmlFor="location-pincode" className="text-sm font-medium text-foreground">
                Or enter your pincode
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="location-pincode"
                  value={pincode}
                  onChange={(event) => {
                    setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    if (status.kind === "error") setStatus({ kind: "idle" })
                  }}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="e.g. 800001"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-base tabular-nums placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <Button type="submit" className="h-11 shrink-0" disabled={busy}>
                  Confirm
                </Button>
              </div>
            </form>

            <div>
              <p className="text-sm font-medium text-foreground">Or choose a city</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {SUGGESTED_CITIES.map((entry) => (
                  <li key={entry.city}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void save({ city: entry.city, state: entry.state })}
                      className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {entry.city}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div aria-live="polite" className="min-h-5">
              {status.kind === "error" ? (
                <p className="text-sm text-destructive">{status.message}</p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
