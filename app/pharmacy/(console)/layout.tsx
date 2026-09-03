import type React from 'react'
import { redirect } from 'next/navigation'

import { resolveDashboardGate } from '@/lib/auth'
import { DashboardShell, DashboardGateScreen } from '@/components/dashboard/dashboard-shell'
import { PHARMACY_NAV } from '@/lib/dashboard-nav'

export const dynamic = 'force-dynamic'

export default async function PharmacyConsoleLayout({ children }: { children: React.ReactNode }) {
  const gate = await resolveDashboardGate('PHARMACY')

  if (gate.state === 'unauthenticated') redirect('/signin?redirect=/pharmacy/dashboard')
  if (gate.state === 'wrong-role') redirect(gate.home)

  if (gate.state === 'no-profile') {
    return (
      <DashboardGateScreen
        title="Finish your pharmacy registration"
        message="We could not find a pharmacy profile for your account. Complete registration to continue."
        action={{ href: '/pharmacy/register', label: 'Register pharmacy' }}
      />
    )
  }

  if (gate.state === 'pending') {
    return (
      <DashboardGateScreen
        title="Approval in progress"
        message="Your pharmacy is being reviewed by our team. You will get access to the console once your documents are verified. Upload any missing documents to speed this up."
        action={{ href: '/pharmacy/documents', label: 'Manage documents' }}
      />
    )
  }

  if (gate.state === 'rejected') {
    return (
      <DashboardGateScreen
        title="Registration needs attention"
        message={gate.rejectionReason || 'Your registration was not approved. Please contact support or re-submit corrected documents.'}
        action={{ href: '/pharmacy/documents', label: 'Manage documents' }}
      />
    )
  }

  return (
    <DashboardShell workspace="Pharmacy console" nav={PHARMACY_NAV} user={gate.user}>
      {children}
    </DashboardShell>
  )
}
