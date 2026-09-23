'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { upsertLine } from '@/lib/cart'
import { formatINR } from '@/lib/money'

interface ProductImage { id: number; url: string; alt: string }
interface ProductListing {
  id: number
  distributor: { id: number; name: string; city: string }
  unitPrice: number
  mrp: number
  available: number
  minOrderQuantity: number
  batchNumber: string | null
  expiryDate: string
}

export function ProductDetail({
  medicine,
  images,
  listings,
}: {
  medicine: { id: number; name: string; genericName: string | null; manufacturer: string | null; form: string | null; strength: string | null; packSize: string | null; hsnCode: string | null; mrp: number; gstRate: number; requiresPrescription: boolean; description: string | null; category: string | null }
  images: ProductImage[]
  listings: ProductListing[]
}) {
  const { toast } = useToast()
  const [selectedImage, setSelectedImage] = useState(images[0])

  function addToCart(listing: ProductListing) {
    upsertLine({
      listingId: listing.id,
      distributorId: listing.distributor.id,
      distributorName: listing.distributor.name,
      medicineName: `${medicine.name}${medicine.strength ? ` ${medicine.strength}` : ''}`,
      unitPrice: listing.unitPrice,
      minOrderQuantity: listing.minOrderQuantity,
      available: listing.available,
      quantity: Math.min(listing.minOrderQuantity, listing.available),
    })
    toast({ title: 'Added to cart', description: medicine.name })
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
            <Image src={selectedImage.url} alt={selectedImage.alt} fill className="object-contain p-8" sizes="(max-width: 1024px) 100vw, 45vw" />
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((image) => (
                <button key={image.id} type="button" onClick={() => setSelectedImage(image)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${selectedImage.id === image.id ? 'border-primary' : 'border-border'}`}>
                  <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{medicine.category ?? 'Medicine'}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{medicine.name}{medicine.strength ? ` ${medicine.strength}` : ''}</h1>
            </div>
            {medicine.requiresPrescription ? <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Rx required</span> : null}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 text-sm">
            {[
              ['Generic name', medicine.genericName], ['Manufacturer', medicine.manufacturer], ['Form', medicine.form],
              ['Pack size', medicine.packSize], ['MRP', formatINR(medicine.mrp)], ['GST', `${medicine.gstRate}%`], ['HSN code', medicine.hsnCode],
            ].map(([label, value]) => value ? <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div> : null)}
          </dl>
          {medicine.description ? <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{medicine.description}</p> : null}
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold">Available from distributors</h2>
        <div className="mt-3 divide-y divide-border rounded-xl border border-border">
          {listings.length ? listings.map((listing) => (
            <div key={listing.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{listing.distributor.name}</p>
                <p className="text-xs text-muted-foreground">{listing.distributor.city} · {listing.available} in stock · MOQ {listing.minOrderQuantity}</p>
                <p className="text-xs text-muted-foreground">Batch {listing.batchNumber ?? '—'} · exp {new Date(listing.expiryDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right"><p className="font-semibold">{formatINR(listing.unitPrice)}</p><p className="text-xs text-muted-foreground line-through">{formatINR(listing.mrp)}</p></div>
                <button type="button" onClick={() => addToCart(listing)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><ShoppingCart className="h-4 w-4" /> Add</button>
              </div>
            </div>
          )) : <p className="p-6 text-sm text-muted-foreground">This medicine is not currently in stock.</p>}
        </div>
      </section>
    </div>
  )
}