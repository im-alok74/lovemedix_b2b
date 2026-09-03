import type React from 'react'
import { redirect } from 'next/navigation'

import { getCurrentUser, roleHome } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { ADMIN_NAV } from '@/lib/dashboard-nav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/signin?redirect=/admin')
  if (user.role !== 'ADMIN') redirect(roleHome(user.role))

  return (
    <DashboardShell workspace="Admin panel" nav={ADMIN_NAV} user={user}>
      {children}
    </DashboardShell>
  )
}
