import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { PageHeading, Card, StatusBadge } from '@/components/dashboard/ui'
import { VerificationActions } from '@/components/admin/verification-actions'
import { DetailField, DocumentsCard } from '@/components/admin/profile-detail'
import { formatINR } from '@/lib/money'

export const dynamic = 'force-dynamic'

export default async function AdminDistributorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const d = await prisma.distributorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, phone: true, status: true, lastLoginAt: true } },
      documents: { orderBy: { createdAt: 'desc' } },
      verifier: { select: { fullName: true } },
      _count: { select: { listings: true, purchaseOrders: true } },
    },
  })
  if (!d) notFound()

  return (
    <div className="max-w-4xl">
      <Link href="/admin/distributors" className="text-sm text-muted-foreground hover:underline">← All distributors</Link>
      <PageHeading
        title={d.companyName}
        description={`Registered ${d.createdAt.toLocaleDateString()} · account ${d.user.status.toLowerCase()}`}
        action={<StatusBadge status={d.verificationStatus} />}
      />

      <Card className="mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold">Review actions</h2>
        <VerificationActions kind="distributors" id={d.id} status={d.verificationStatus} />
        {d.rejectionReason ? <p className="mt-3 text-sm text-red-600">Rejection note: {d.rejectionReason}</p> : null}
        {d.verifier ? <p className="mt-2 text-xs text-muted-foreground">Last reviewed by {d.verifier.fullName}</p> : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Business details</h2>
          <dl className="grid grid-cols-2 gap-4">
            <DetailField label="Contact person" value={d.contactPerson} />
            <DetailField label="Login email" value={d.user.email} />
            <DetailField label="Phone" value={d.phone ?? d.user.phone} />
            <DetailField label="GST number" value={d.gstNumber} />
            <DetailField label="Business licence" value={d.businessLicense} />
            <DetailField label="Drug licence" value={d.drugLicenseNumber} />
            <DetailField label="Licence expiry" value={d.licenseExpiry ? d.licenseExpiry.toLocaleDateString() : null} />
            <DetailField label="Min order value" value={formatINR(d.minOrderValue)} />
            <DetailField
              label="Address"
              value={[d.addressLine1, d.addressLine2, `${d.city}, ${d.state} ${d.pincode}`].filter(Boolean).join(', ')}
            />
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Activity</h2>
          <dl className="grid grid-cols-2 gap-4">
            <DetailField label="Active listings" value={d._count.listings} />
            <DetailField label="Purchase orders" value={d._count.purchaseOrders} />
            <DetailField label="Last login" value={d.user.lastLoginAt ? d.user.lastLoginAt.toLocaleString() : 'Never'} />
          </dl>
        </Card>
      </div>

      <div className="mt-6">
        <DocumentsCard documents={d.documents} />
      </div>
    </div>
  )
}
