import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminPurchaseRequestsTable } from "@/components/admin/admin-purchase-requests-table"

export default async function AdminPurchaseRequestsPage() {
  const user = await requireRole(["admin"])

  if (!user) {
    redirect("/signin")
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Procurement Requests</h1>
          <p className="text-muted-foreground">
            Review and approve pharmacy purchase requests from distributors.
          </p>
        </div>

        <AdminPurchaseRequestsTable />
      </div>
    </AdminLayout>
  )
}

