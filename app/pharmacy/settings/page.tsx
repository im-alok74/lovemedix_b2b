import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default async function PharmacySettingsPage() {
  const { pharmacyId } = await requirePharmacyProfile()

  const profileRows = await sql`
    SELECT
      pp.pharmacy_name,
      pp.registration_number,
      pp.gst_number,
      pp.contact_person,
      pp.phone,
      pp.email,
      pp.address_line1,
      pp.address_line2,
      pp.city,
      pp.state,
      pp.pincode,
      pp.license_number,
      pp.license_expiry,
      pp.verification_status,
      pp.notes,
      u.email AS user_email
    FROM pharmacy_profiles pp
    JOIN users u ON u.id = pp.user_id
    WHERE pp.id = ${pharmacyId}
    LIMIT 1
  `

  if (!profileRows.length) {
    redirect('/pharmacy/register')
  }

  const p = profileRows[0] as any

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/pharmacy/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-6">Pharmacy Settings</h1>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{p.pharmacy_name}</h2>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium">{p.verification_status}</span>
                </p>
              </div>
            </div>

            <form action="/api/pharmacy/profile" method="POST" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName">Pharmacy Name</Label>
                  <Input id="pharmacyName" name="pharmacyName" defaultValue={p.pharmacy_name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" name="contactPerson" defaultValue={p.contact_person || ''} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={p.phone || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={p.email || p.user_email || ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input id="addressLine1" name="addressLine1" defaultValue={p.address_line1} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input id="addressLine2" name="addressLine2" defaultValue={p.address_line2 || ''} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={p.city} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" defaultValue={p.state} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" defaultValue={p.pincode} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" name="gstNumber" defaultValue={p.gst_number || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input id="licenseNumber" name="licenseNumber" defaultValue={p.license_number || ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={p.notes || ''}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
