import Link from 'next/link'

import { PageHeading, Card } from '@/components/dashboard/ui'
import { InventoryForm } from '@/components/pharmacy/inventory-form'

export const metadata = { title: 'Add stock' }

export default function NewInventoryPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/pharmacy/inventory" className="text-sm text-muted-foreground hover:underline">← Inventory</Link>
      <PageHeading title="Add stock" />
      <Card className="p-5">
        <InventoryForm />
      </Card>
    </div>
  )
}
