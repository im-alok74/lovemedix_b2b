import Link from 'next/link'

import { PageHeading, Card } from '@/components/dashboard/ui'
import { CustomerForm } from '@/components/pharmacy/customer-form'

export const metadata = { title: 'Add customer' }

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/pharmacy/customers" className="text-sm text-muted-foreground hover:underline">← Customers</Link>
      <PageHeading title="Add customer" />
      <Card className="p-5">
        <CustomerForm />
      </Card>
    </div>
  )
}
