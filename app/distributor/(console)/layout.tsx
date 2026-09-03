import type React from 'react'
import { redirect } from 'next/navigation'

import { resolveDashboardGate } from '@/lib/auth'
import { DashboardShell, DashboardGateScreen } from '@/components/dashboard/dashboard-shell'
import { DISTRIBUTOR_NAV } from '@/lib/dashboard-nav'

export const dynamic = 'force-dynamic'

export default async function DistributorConsoleLayout({ children }: { children: React.ReactNode }) {
  const gate = await resolveDashboardGate('DISTRIBUTOR')

  if (gate.state === 'unauthenticated') redirect('/signin?redirect=/distributor/dashboard')
  if (gate.state === 'wrong-role') redirect(gate.home)

  if (gate.state === 'no-profile') {
    return (
      <DashboardGateScreen
        title="Finish your distributor registration"
        message="We could not find a distributor profile for your account. Complete registration to continue."
        action={{ href: '/distributor/register', label: 'Register distributor' }}
      />
    )
  }

  if (gate.state === 'pending') {
    return (
      <DashboardGateScreen
        title="Approval in progress"
        message="Your distributor account is being reviewed. Once your business and drug-licence documents are verified you can start listing medicines."
        action={{ href: '/distributor/documents', label: 'Manage documents' }}
      />
    )
  }

  if (gate.state === 'rejected') {
    return (
      <DashboardGateScreen
        title="Registration needs attention"
        message={gate.rejectionReason || 'Your registration was not approved. Please contact support or re-submit corrected documents.'}
        action={{ href: '/distributor/documents', label: 'Manage documents' }}
      />
    )
  }

  return (
    <DashboardShell workspace="Distributor console" nav={DISTRIBUTOR_NAV} user={gate.user}>
      {children}
    </DashboardShell>
  )
}
