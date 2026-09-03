import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getDistributorContext } from '@/lib/auth'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { ListingForm } from '@/components/distributor/listing-form'
import { ApiAction } from '@/components/dashboard/api-action'

export const dynamic = 'force-dynamic'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getDistributorContext()
  if (!ctx?.id) return null
  const id = Number((await params).id)
  const listing = await prisma.distributorListing.findFirst({
    where: { id, distributorId: ctx.id },
    include: { medicine: { select: { name: true, strength: true, manufacturer: true } } },
  })
  if (!listing) notFound()

  const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

  return (
    <div className="max-w-2xl">
      <Link href="/distributor/listings" className="text-sm text-muted-foreground hover:underline">← Listings</Link>
      <PageHeading
        title="Edit listing"
        action={
          <ApiAction
            endpoint={`/api/distributor/listings/${id}`}
            method="DELETE"
            label="Delete"
            variant="danger"
            confirm="Delete this listing? It is deactivated instead if it has been ordered."
            redirectTo="/distributor/listings"
          />
        }
      />
      <Card className="p-5">
        <ListingForm
          initial={{
            id: listing.id,
            medicineId: listing.medicineId,
            medicineLabel: `${listing.medicine.name}${listing.medicine.strength ? ` ${listing.medicine.strength}` : ''}${listing.medicine.manufacturer ? ` · ${listing.medicine.manufacturer}` : ''}`,
            batchNumber: listing.batchNumber ?? '',
            mfgDate: toDateInput(listing.mfgDate),
            expiryDate: toDateInput(listing.expiryDate),
            mrp: String(listing.mrp),
            unitPrice: String(listing.unitPrice),
            quantity: String(listing.quantity),
            minOrderQuantity: String(listing.minOrderQuantity),
            hsnCode: listing.hsnCode ?? '',
            isActive: listing.isActive,
          }}
        />
      </Card>
    </div>
  )
}
