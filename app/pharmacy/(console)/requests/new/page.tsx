import Link from 'next/link'

import prisma from '@/lib/prisma'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { RequestForm } from '@/components/pharmacy/request-form'

export const metadata = { title: 'New request' }
export const dynamic = 'force-dynamic'

export default async function NewRequestPage() {
  const distributors = await prisma.distributorProfile.findMany({
    where: { verificationStatus: 'VERIFIED', isActive: true },
    orderBy: { companyName: 'asc' },
    select: { id: true, companyName: true },
  })
  return (
    <div className="max-w-2xl">
      <Link href="/pharmacy/requests" className="text-sm text-muted-foreground hover:underline">← Requests</Link>
      <PageHeading title="Raise a medicine request" />
      <Card className="p-5">
        <RequestForm distributors={distributors.map((d) => ({ id: d.id, name: d.companyName }))} />
      </Card>
    </div>
  )
}
