import prisma from '@/lib/prisma'
import { PageHeading } from '@/components/dashboard/ui'
import { CatalogBrowser } from '@/components/pharmacy/catalog-browser'

export const metadata = { title: 'Browse catalog' }
export const dynamic = 'force-dynamic'

export default async function PharmacyCatalogPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true },
  })
  return (
    <div>
      <PageHeading title="Browse catalog" description="Wholesale listings from approved distributors. Add items to your cart to place a bulk order." />
      <CatalogBrowser categories={categories} />
    </div>
  )
}
