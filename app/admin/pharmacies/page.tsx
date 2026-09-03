import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PharmacyVerificationActions } from "@/components/admin/pharmacy-verification-actions"
import AdminUserActions from "@/components/admin/admin-user-actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Phone, MapPin, FileCheck, Users, TrendingUp } from "lucide-react"

interface Pharmacy {
  id: number
  user_id: number
  pharmacy_name: string
  registration_number: string | null
  gst_number: string | null
  contact_person: string | null
  phone: string | null
  city: string
  state: string
  commission_rate: number
  verification_status: "PENDING" | "VERIFIED" | "REJECTED"
  user_status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  full_name: string
  email: string
  user_phone: string | null
  created_at: string
}

export default async function AdminPharmaciesPage() {
  const user = await requireRole(["admin"])

  if (!user) {
    redirect("/signin")
  }

  const pharmacies = await sql`
    SELECT pp.id, pp.pharmacy_name, pp.registration_number, pp.gst_number,
           pp.contact_person, pp.phone, pp.city, pp.state, pp.commission_rate,
           pp.verification_status, pp.created_at,
           u.id AS user_id, u.email, u.full_name, u.phone AS user_phone, u.status AS user_status
    FROM pharmacy_profiles pp
    JOIN users u ON pp.user_id = u.id
    ORDER BY pp.created_at DESC
    LIMIT 50
  ` as Pharmacy[]

  const stats = {
    total: pharmacies.length,
    active: pharmacies.filter(p => p.user_status === "ACTIVE").length,
    pending: pharmacies.filter(p => p.verification_status === "PENDING").length,
    verified: pharmacies.filter(p => p.verification_status === "VERIFIED").length,
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pharmacies</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage and verify pharmacy registrations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border border-border/50">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-green-600">{stats.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-blue-600">{stats.verified}</p>
                </div>
                <FileCheck className="h-8 w-8 md:h-10 md:w-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{stats.pending}</p>
                </div>
                <Building2 className="h-8 w-8 md:h-10 md:w-10 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block">
          <Card className="border border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="px-4 py-3">Pharmacy</TableHead>
                      <TableHead className="px-4 py-3">Contact</TableHead>
                      <TableHead className="px-4 py-3">License</TableHead>
                      <TableHead className="px-4 py-3">Location</TableHead>
                      <TableHead className="px-4 py-3">Commission</TableHead>
                      <TableHead className="px-4 py-3">Verification</TableHead>
                      <TableHead className="px-4 py-3">Status</TableHead>
                      <TableHead className="px-4 py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          No pharmacies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pharmacies.map((p: Pharmacy) => (
                        <TableRow key={p.id} className="border-b hover:bg-muted/50 transition-colors">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">{p.pharmacy_name}</p>
                                <p className="text-xs text-muted-foreground">{p.registration_number || "N/A"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{p.contact_person || p.full_name}</p>
                              <p className="text-xs text-muted-foreground">{p.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{p.license_number || "N/A"}</code>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {p.city}, {p.state}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="text-sm font-semibold">{Number(p.commission_rate).toFixed(2)}%</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              variant={
                                p.verification_status === "VERIFIED"
                                  ? "default"
                                  : p.verification_status === "REJECTED"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {p.verification_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              variant={
                                p.user_status === "ACTIVE"
                                  ? "default"
                                  : p.user_status === "SUSPENDED"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {p.user_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {p.verification_status === "PENDING" && (
                                <PharmacyVerificationActions pharmacyId={p.id} />
                              )}
                              {p.verification_status !== "PENDING" && (
                                <AdminUserActions userId={p.user_id} />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:hidden space-y-3">
          {pharmacies.length === 0 ? (
            <Card className="border border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No pharmacies found
              </CardContent>
            </Card>
          ) : (
            pharmacies.map((p: Pharmacy) => (
              <Card key={p.id} className="border border-border/50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{p.pharmacy_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{p.registration_number || "N/A"}</p>
                      </div>
                      <Badge
                        variant={
                          p.verification_status === "VERIFIED"
                            ? "default"
                            : p.verification_status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {p.verification_status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Contact:</span> {p.contact_person || p.full_name}
                      </p>
                      <p className="text-muted-foreground break-all">{p.email}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {p.city}, {p.state}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Commission</p>
                        <p className="font-semibold text-sm">{Number(p.commission_rate).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge
                          variant={
                            p.user_status === "ACTIVE"
                              ? "default"
                              : p.user_status === "SUSPENDED"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {p.user_status}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      {p.verification_status === "PENDING" && (
                        <PharmacyVerificationActions pharmacyId={p.id} />
                      )}
                      {p.verification_status !== "PENDING" && (
                        <AdminUserActions userId={p.user_id} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
