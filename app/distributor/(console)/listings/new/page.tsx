import Link from 'next/link'

import { PageHeading, Card } from '@/components/dashboard/ui'
import { ListingForm } from '@/components/distributor/listing-form'

export const metadata = { title: 'New listing' }

export default function NewListingPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/distributor/listings" className="text-sm text-muted-foreground hover:underline">← Listings</Link>
      <PageHeading title="Add a listing" />
      <Card className="p-5">
        <ListingForm />
      </Card>
    </div>
  )
}
