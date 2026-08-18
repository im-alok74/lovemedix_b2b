"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FilterSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function FilterSection({ title, children, defaultOpen = true, className }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-background/70", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
    </div>
  )
}
