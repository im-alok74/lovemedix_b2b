import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminOutOfStockRequestsTable } from "@/components/admin/admin-out-of-stock-requests-table"

export default async function AdminOutOfStockRequestsPage() {
  const user = await requireRole(["admin"])

  if (!user) {
    redirect("/signin")
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Out-of-Stock Requests</h1>
          <p className="text-muted-foreground">
            Manage pharmacy requests for medicines that are out of stock. Automatically or manually assign requests to distributors with available stock.
          </p>
        </div>

        <AdminOutOfStockRequestsTable />
      </div>
    </AdminLayout>
  )
}
