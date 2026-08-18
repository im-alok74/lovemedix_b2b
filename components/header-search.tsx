"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"

import { formatINR } from "@/lib/pricing"

interface Suggestion {
  id: number
  name: string
  slug: string | null
  generic_name: string | null
  manufacturer: string | null
  mrp: string | number
  requires_prescription: boolean
}

/**
 * Type-ahead medicine search.
 *
 * Debounced at 250ms and aborts the previous request on each keystroke, so a fast typist
 * generates one useful round trip rather than one per character with results arriving
 * out of order.
 */
export function HeaderSearch({
  size = "default",
  tone = "default",
  placeholder = "Search medicines, brands or salts",
}: {
  /**
   * `lg` is the homepage hero treatment: a 56px field with 16px text.
   *
   * 16px is a floor, not a preference — mobile Safari and several Android browsers zoom
   * the viewport when a focused input has text below 16px, which on this page would jerk
   * the whole hero sideways the moment someone taps search.
   */
  size?: "default" | "lg"
  /**
   * `hero` is the field sitting on the dark band. It only changes the *resting* fill —
   * a translucent `bg-muted/40` over dark green resolves to a muddy panel with a grey
   * placeholder on it, well under contrast minimums. The suggestion popover below is
   * untouched and stays on `bg-popover`, because it overlaps body-coloured page content
   * rather than the band.
   */
  tone?: "default" | "hero"
  placeholder?: string
} = {}) {
  const router = useRouter()
  const isLarge = size === "lg"
  const isHero = tone === "hero"
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const query = term.trim()
    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(
          `/api/medicines/search?q=${encodeURIComponent(query)}&limit=7`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error("search failed")
        const data = await response.json()
        setResults(Array.isArray(data.medicines) ? data.medicines : [])
        setActiveIndex(-1)
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [term])

  // Close on outside click.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  function goToSearch() {
    const query = term.trim()
    if (!query) return
    setOpen(false)
    router.push(`/medicines?search=${encodeURIComponent(query)}`)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (event.key === "Enter") {
      const active = results[activeIndex]
      if (active) {
        event.preventDefault()
        setOpen(false)
        router.push(`/medicines/${active.slug || active.id}`)
      } else {
        goToSearch()
      }
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const showPanel = open && term.trim().length >= 2

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground ${
            isLarge ? "left-4 h-5 w-5" : "left-3 h-4 w-4"
          }`}
          aria-hidden
        />
        <input
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search medicines"
          aria-expanded={showPanel}
          aria-controls="header-search-results"
          role="combobox"
          aria-autocomplete="list"
          className={`w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
            isHero
              ? "border border-transparent bg-background focus:border-transparent focus:ring-white/60"
              : "border border-input bg-muted/40 focus:border-ring focus:bg-background focus:ring-ring/30"
          } ${
            isLarge
              ? "h-14 rounded-xl pl-12 pr-11 text-base shadow-sm"
              : "h-10 rounded-md pl-9 pr-9 text-sm"
          }`}
        />
        {loading ? (
          <Loader2
            className={`absolute top-1/2 -translate-y-1/2 animate-spin text-muted-foreground ${
              isLarge ? "right-4 h-5 w-5" : "right-3 h-4 w-4"
            }`}
            aria-hidden
          />
        ) : term ? (
          <button
            type="button"
            onClick={() => {
              setTerm("")
              setResults([])
            }}
            aria-label="Clear search"
            className={`absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground ${
              isLarge ? "right-3 h-8 w-8" : "right-2 h-6 w-6"
            }`}
          >
            <X className={isLarge ? "h-5 w-5" : "h-4 w-4"} />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id="header-search-results"
          role="listbox"
          className={`absolute left-0 right-0 z-50 overflow-hidden rounded-md border border-border bg-popover shadow-lg ${
            isLarge ? "top-16" : "top-12"
          }`}
        >
          {results.length > 0 ? (
            <>
              <ul className="max-h-[22rem] overflow-y-auto py-1">
                {results.map((item, index) => (
                  <li key={item.id}>
                    <Link
                      href={`/medicines/${item.slug || item.id}`}
                      onClick={() => setOpen(false)}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors ${
                        index === activeIndex ? "bg-accent" : "hover:bg-accent"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{item.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[item.generic_name, item.manufacturer].filter(Boolean).join(" · ") || "Medicine"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {item.requires_prescription ? (
                          <span className="rounded border border-warning/40 px-1.5 py-0.5 text-[10px] font-medium uppercase text-[color:var(--warning-foreground)]">
                            Rx
                          </span>
                        ) : null}
                        <span className="price text-sm">{formatINR(item.mrp)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToSearch}
                className="w-full border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-accent"
              >
                See all results for &ldquo;{term.trim()}&rdquo;
              </button>
            </>
          ) : loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Searching…</p>
          ) : (
            <div className="px-3 py-4">
              <p className="text-sm text-foreground">No medicines matched &ldquo;{term.trim()}&rdquo;.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try the salt name (e.g. paracetamol) or upload your prescription instead.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
