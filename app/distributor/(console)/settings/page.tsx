import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getDistributorContext } from '@/lib/auth'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { DistributorSettingsForm } from '@/components/distributor/settings-form'

export const metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function DistributorSettingsPage() {
  const ctx = await getDistributorContext()
  if (!ctx?.id) return null
  const p = await prisma.distributorProfile.findUnique({ where: { id: ctx.id } })
  if (!p) return null

  return (
    <div className="max-w-2xl">
      <PageHeading
        title="Company settings"
        description="Keep your details current — they appear on every invoice."
        action={
          <Link href="/distributor/documents" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
            Documents
          </Link>
        }
      />
      <Card className="p-5">
        <DistributorSettingsForm
          initial={{
            companyName: p.companyName,
            contactPerson: p.contactPerson ?? '',
            phone: p.phone ?? '',
            email: p.email ?? '',
            gstNumber: p.gstNumber ?? '',
            cin: p.cin ?? '',
            drugLicenseNumber: p.drugLicenseNumber ?? '',
            addressLine1: p.addressLine1,
            addressLine2: p.addressLine2 ?? '',
            city: p.city,
            state: p.state,
            pincode: p.pincode,
            minOrderValue: String(p.minOrderValue),
            bankName: p.bankName ?? '',
            bankAccountNumber: p.bankAccountNumber ?? '',
            bankIfsc: p.bankIfsc ?? '',
            bankBranch: p.bankBranch ?? '',
          }}
        />
      </Card>
    </div>
  )
}
