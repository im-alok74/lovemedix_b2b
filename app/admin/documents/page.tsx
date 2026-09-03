import Link from 'next/link'

import prisma from '@/lib/prisma'
import { PageHeading, Card, EmptyState, StatusBadge } from '@/components/dashboard/ui'
import { DocumentActions } from '@/components/admin/verification-actions'

export const metadata = { title: 'Document review' }
export const dynamic = 'force-dynamic'

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const status = ((await searchParams).status ?? 'PENDING').toUpperCase()
  const where = status === 'ALL' ? {} : { verificationStatus: status as 'PENDING' | 'VERIFIED' | 'REJECTED' }

  const docs = await prisma.document.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      pharmacyProfile: { select: { id: true, pharmacyName: true } },
      distributorProfile: { select: { id: true, companyName: true } },
    },
  })

  return (
    <div>
      <PageHeading title="Document review" description="Verify business and drug-licence documents." />
      <div className="mb-4 flex gap-2">
        {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map((t) => (
          <Link
            key={t}
            href={`/admin/documents?status=${t}`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              status === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
            }`}
          >
            {t.toLowerCase()}
          </Link>
        ))}
      </div>

      {docs.length === 0 ? (
        <EmptyState title="Nothing to review" message="No documents in this state." />
      ) : (
        <Card className="divide-y divide-border">
          {docs.map((doc) => {
            const owner = doc.pharmacyProfile
              ? { label: doc.pharmacyProfile.pharmacyName, href: `/admin/pharmacies/${doc.pharmacyProfile.id}` }
              : doc.distributorProfile
                ? { label: doc.distributorProfile.companyName, href: `/admin/distributors/${doc.distributorProfile.id}` }
                : { label: 'Unknown', href: '#' }
            return (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={owner.href} className="text-sm font-medium hover:underline">{owner.label}</Link>
                  <div className="text-xs text-muted-foreground">
                    {doc.documentType.replace(/_/g, ' ').toLowerCase()} ·{' '}
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {doc.fileName}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.verificationStatus} />
                  {doc.verificationStatus === 'PENDING' ? <DocumentActions id={doc.id} /> : null}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
