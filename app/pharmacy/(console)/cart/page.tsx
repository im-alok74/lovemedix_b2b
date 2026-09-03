import { PageHeading } from '@/components/dashboard/ui'
import { CartView } from '@/components/pharmacy/cart-view'

export const metadata = { title: 'Cart' }

export default function PharmacyCartPage() {
  return (
    <div className="max-w-3xl">
      <PageHeading title="Procurement cart" description="Items are grouped by distributor — each group becomes one purchase order." />
      <CartView />
    </div>
  )
}
