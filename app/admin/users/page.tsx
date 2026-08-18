import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-server"
import { query, sql } from "@/lib/db"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminUsersTable } from "@/components/admin/users-table"

type AdminUserRow = React.ComponentProps<typeof AdminUsersTable>["initialUsers"][number]

export default async function AdminUsersPage() {
  const user = await requireRole(["admin"])

  if (!user) {
    redirect("/signin")
  }

  const initialUsers = await query<AdminUserRow>`
    SELECT id, email, full_name, phone, user_type, status, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `

  const totalUsersResult = await sql`
    SELECT COUNT(*) as total FROM users
  `
  const totalUsers = (totalUsersResult[0] as any).total

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage all users on the platform</p>
        </div>
        <AdminUsersTable initialUsers={initialUsers} totalInitialUsers={totalUsers} currentUser={user} />
      </div>
    </AdminLayout>
  )
}
