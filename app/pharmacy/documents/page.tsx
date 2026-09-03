import { redirect } from 'next/navigation'
import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getCurrentUser, roleHome } from '@/lib/auth'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { StatusBadge } from '@/components/dashboard/ui'
import { DocumentsManager } from '@/components/dashboard/documents-manager'

export const metadata = { title: 'Documents' }
export const dynamic = 'force-dynamic'

export default async function PharmacyDocumentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/signin?redirect=/pharmacy/documents')
  if (user.role !== 'PHARMACY') redirect(roleHome(user.role))

  const profile = await prisma.pharmacyProfile.findUnique({
    where: { userId: user.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  })
  if (!profile) redirect('/pharmacy/register')

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Verification documents</h1>
          <StatusBadge status={profile.verificationStatus} />
        </div>
        {profile.verificationStatus === 'VERIFIED' ? (
          <p className="mb-6 text-sm text-emerald-700">
            Your pharmacy is approved. <Link href="/pharmacy/dashboard" className="underline">Go to your console →</Link>
          </p>
        ) : profile.verificationStatus === 'REJECTED' && profile.rejectionReason ? (
          <p className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{profile.rejectionReason}</p>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">
            Add your drug licence and GST certificate. Our team verifies them, usually within a business day.
          </p>
        )}
        <DocumentsManager
          endpoint="/api/pharmacy/documents"
          documents={profile.documents.map((d) => ({
            id: d.id,
            documentType: d.documentType,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            verificationStatus: d.verificationStatus,
            rejectionReason: d.rejectionReason,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      </main>
      <Footer />
    </div>
  )
}
