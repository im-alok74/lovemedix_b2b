import Link from 'next/link'

import { PageHeading } from '@/components/dashboard/ui'
import { BulkUpload } from '@/components/distributor/bulk-upload'

export const metadata = { title: 'Bulk upload' }

export default function BulkUploadPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/distributor/listings" className="text-sm text-muted-foreground hover:underline">← Listings</Link>
      <PageHeading title="Bulk upload listings" description="Import many batches from a spreadsheet." />
      <BulkUpload />
    </div>
  )
}
