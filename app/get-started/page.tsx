import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store, Truck, ArrowRight } from 'lucide-react'

import { getCurrentUser, roleHome } from '@/lib/auth'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata = { title: 'Get started' }

const OPTIONS = [
  {
    href: '/pharmacy/register',
    icon: Store,
    title: 'I run a pharmacy',
    body: 'Buy medicines in bulk from verified distributors, raise requests, and manage your shop, inventory and customer billing.',
  },
  {
    href: '/distributor/register',
    icon: Truck,
    title: 'I am a distributor',
    body: 'List your stock with live pricing, batch and expiry, and fulfil purchase orders from approved pharmacies.',
  },
]

export default async function GetStartedPage() {
  const user = await getCurrentUser()
  if (user) redirect(roleHome(user.role))

  return (
    <AuthShell
      title="Get started with Lovemedix"
      subtitle="Choose how you want to join the marketplace."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        {OPTIONS.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="group flex items-start gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <o.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between">
                <span className="font-semibold">{o.title}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{o.body}</span>
            </span>
          </Link>
        ))}
      </div>
    </AuthShell>
  )
}
