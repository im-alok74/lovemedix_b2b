import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { PharmacySettingsForm } from '@/components/pharmacy/settings-form'

export const metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function PharmacySettingsPage() {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const p = await prisma.pharmacyProfile.findUnique({ where: { id: ctx.id } })
  if (!p) return null

  return (
    <div className="max-w-2xl">
      <PageHeading
        title="Pharmacy settings"
        description="These details appear on every customer bill."
        action={<Link href="/pharmacy/documents" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">Documents</Link>}
      />
      <Card className="p-5">
        <PharmacySettingsForm
          initial={{
            pharmacyName: p.pharmacyName,
            contactPerson: p.contactPerson ?? '',
            phone: p.phone ?? '',
            email: p.email ?? '',
            gstNumber: p.gstNumber ?? '',
            registrationNumber: p.registrationNumber ?? '',
            drugLicenseNumber: p.drugLicenseNumber ?? '',
            addressLine1: p.addressLine1,
            addressLine2: p.addressLine2 ?? '',
            city: p.city,
            state: p.state,
            pincode: p.pincode,
          }}
        />
      </Card>
    </div>
  )
}
