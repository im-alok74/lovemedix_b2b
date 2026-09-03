'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Truck,
  FileCheck2,
  Pill,
  Tags,
  ClipboardList,
  PackageSearch,
  Users,
  Settings,
  ShoppingCart,
  Boxes,
  ReceiptText,
  Contact,
  FileText,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { NavItem } from '@/lib/dashboard-nav'
import { Logo } from '@/components/brand/logo'

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  building: Building2,
  truck: Truck,
  'file-check': FileCheck2,
  pill: Pill,
  tags: Tags,
  clipboard: ClipboardList,
  'package-search': PackageSearch,
  users: Users,
  settings: Settings,
  cart: ShoppingCart,
  boxes: Boxes,
  receipt: ReceiptText,
  contact: Contact,
  'file-text': FileText,
}

function isActive(pathname: string, href: string) {
  if (href.split('/').length <= 2) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Links({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon ? ICONS[item.icon] : undefined
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {Icon ? <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} /> : null}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardSidebar({ workspace, items }: { workspace: string; items: NavItem[] }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo href="/" size="sm" subtitle={workspace} />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <Links items={items} />
      </div>
    </aside>
  )
}

export function DashboardMobileNav({ workspace, items }: { workspace: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
          <div className="w-72 max-w-[80vw] overflow-y-auto bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <Logo href={null} size="sm" subtitle={workspace} />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Links items={items} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
