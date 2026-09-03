import prisma from '@/lib/prisma'
import { PageHeading } from '@/components/dashboard/ui'
import { CategoryManager } from '@/components/admin/category-manager'

export const metadata = { title: 'Categories' }
export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, slug: true, displayOrder: true, isActive: true,
      _count: { select: { medicines: true } },
    },
  })

  return (
    <div className="max-w-3xl">
      <PageHeading title="Categories" description="Taxonomy for the medicine catalog." />
      <CategoryManager
        rows={categories.map((c) => ({
          id: c.id, name: c.name, slug: c.slug, displayOrder: c.displayOrder,
          isActive: c.isActive, medicineCount: c._count.medicines,
        }))}
      />
    </div>
  )
}
