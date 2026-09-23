import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { PageHeading } from '@/components/dashboard/ui'
import { ProductDetail } from '@/components/pharmacy/product-detail'

export const dynamic = 'force-dynamic'

export default async function PharmacyMedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const medicine = await prisma.medicine.findFirst({
    where: { id, status: 'ACTIVE' },
    include: {
      category: { select: { name: true } },
      images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      listings: {
        where: { isActive: true, quantity: { gt: 0 }, expiryDate: { gt: new Date() }, distributor: { verificationStatus: 'VERIFIED', isActive: true } },
        orderBy: { unitPrice: 'asc' },
        include: { distributor: { select: { id: true, companyName: true, city: true } }, variant: { select: { id: true, size: true, sku: true } } },
      },
    },
  })
  if (!medicine) notFound()

  const images = [
    ...(medicine.photoUrl ? [{ id: 0, url: medicine.photoUrl, alt: medicine.name }] : []),
    ...medicine.images.filter((image) => image.imageUrl !== medicine.photoUrl).map((image) => ({ id: image.id, url: image.imageUrl, alt: image.altText || medicine.name })),
  ]
  if (!images.length) images.push({ id: 0, url: '/og-default.png', alt: medicine.name })

  return (
    <div>
      <Link href="/pharmacy/catalog" className="text-sm text-muted-foreground hover:underline">← Browse catalog</Link>
      <PageHeading title="Medicine details" />
      <ProductDetail
        medicine={{ id: medicine.id, name: medicine.name, genericName: medicine.genericName, manufacturer: medicine.manufacturer, form: medicine.form, strength: medicine.strength, packSize: medicine.packSize, hsnCode: medicine.hsnCode, mrp: Number(medicine.mrp), gstRate: Number(medicine.gstRate), requiresPrescription: medicine.requiresPrescription, description: medicine.description, category: medicine.category?.name ?? null }}
        images={images}
        listings={medicine.listings.map((listing) => ({ id: listing.id, variant: listing.variant, distributor: { id: listing.distributor.id, name: listing.distributor.companyName, city: listing.distributor.city }, unitPrice: Number(listing.unitPrice), mrp: Number(listing.mrp), available: listing.quantity - listing.reservedQuantity, minOrderQuantity: listing.minOrderQuantity, batchNumber: listing.batchNumber, expiryDate: listing.expiryDate.toISOString() }))}
      />
    </div>
  )
}