import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { PageHeading, Card, StatusBadge } from '@/components/dashboard/ui'
import { VerificationActions } from '@/components/admin/verification-actions'
import { DetailField, DocumentsCard } from '@/components/admin/profile-detail'

export default async function AdminPharmacyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const p = await prisma.pharmacyProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, phone: true, status: true, lastLoginAt: true, createdAt: true } },
      documents: { orderBy: { createdAt: 'desc' } },
      verifier: { select: { fullName: true } },
      _count: { select: { purchaseOrders: true, inventory: true, customers: true, sales: true } },
    },
  })
  if (!p) notFound()

  return (
    <div className="max-w-4xl">
      <Link href="/admin/pharmacies" className="text-sm text-muted-foreground hover:underline">← All pharmacies</Link>
      <PageHeading
        title={p.pharmacyName}
        description={`Registered ${p.createdAt.toLocaleDateString()} · account ${p.user.status.toLowerCase()}`}
        action={<StatusBadge status={p.verificationStatus} />}
      />

      <Card className="mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold">Review actions</h2>
        <VerificationActions kind="pharmacies" id={p.id} status={p.verificationStatus} />
        {p.rejectionReason ? <p className="mt-3 text-sm text-red-600">Rejection note: {p.rejectionReason}</p> : null}
        {p.verifier ? <p className="mt-2 text-xs text-muted-foreground">Last reviewed by {p.verifier.fullName}</p> : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Business details</h2>
          <dl className="grid grid-cols-2 gap-4">
            <DetailField label="Contact person" value={p.contactPerson} />
            <DetailField label="Login email" value={p.user.email} />
            <DetailField label="Phone" value={p.phone ?? p.user.phone} />
            <DetailField label="GST number" value={p.gstNumber} />
            <DetailField label="Registration no." value={p.registrationNumber} />
            <DetailField label="Drug licence" value={p.drugLicenseNumber} />
            <DetailField
              label="Licence expiry"
              value={p.licenseExpiry ? p.licenseExpiry.toLocaleDateString() : null}
            />
            <DetailField
              label="Address"
              value={[p.addressLine1, p.addressLine2, `${p.city}, ${p.state} ${p.pincode}`].filter(Boolean).join(', ')}
            />
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Activity</h2>
          <dl className="grid grid-cols-2 gap-4">
            <DetailField label="Purchase orders" value={p._count.purchaseOrders} />
            <DetailField label="Inventory lines" value={p._count.inventory} />
            <DetailField label="Customers" value={p._count.customers} />
            <DetailField label="Retail sales" value={p._count.sales} />
            <DetailField
              label="Last login"
              value={p.user.lastLoginAt ? p.user.lastLoginAt.toLocaleString() : 'Never'}
            />
          </dl>
        </Card>
      </div>

      <div className="mt-6">
        <DocumentsCard documents={p.documents} />
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
