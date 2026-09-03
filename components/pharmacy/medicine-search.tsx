'use client'

import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'

export interface MedicineHit {
  id: number
  name: string
  strength: string | null
  manufacturer: string | null
  form: string | null
  packSize: string | null
  mrp: string
  gstRate: string
}

export function MedicineSearch({
  endpoint = '/api/pharmacy/medicines',
  onPick,
  placeholder = 'Search the catalog…',
}: {
  endpoint?: string
  onPick: (m: MedicineHit) => void
  placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<MedicineHit[]>([])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([])
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`)
      const data = await res.json().catch(() => ({}))
      if (data?.success) setHits(data.data)
    }, 250)
  }, [q, endpoint])

  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {hits.length > 0 ? (
        <ul className="mt-1 max-h-56 overflow-auto rounded-md border border-border">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onPick(h)
                  setQ('')
                  setHits([])
                }}
              >
                {h.name} {h.strength} <span className="text-muted-foreground">{h.manufacturer}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
