import type React from 'react'
import Link from 'next/link'
import { ShieldCheck, PackageCheck, ReceiptText } from 'lucide-react'

import { Logo } from '@/components/brand/logo'

const POINTS = [
  { icon: ShieldCheck, text: 'Verified pharmacies and distributors only' },
  { icon: PackageCheck, text: 'Live wholesale stock, batch and expiry' },
  { icon: ReceiptText, text: 'Automatic GST invoicing on every order' },
]

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
        <Logo href="/" onColor />
        <div className="relative">
          <h2 className="text-2xl font-bold leading-tight">
            The B2B pharmaceutical marketplace built on verification.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-sm text-primary-foreground/90">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <p.icon className="h-4 w-4" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">
          For registered pharmacies and licensed distributors.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-muted/20">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 lg:hidden">
          <Logo href="/" size="sm" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">{children}</div>
            {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
            <p className="mt-8 text-center text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">← Back to lovemedix.in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
