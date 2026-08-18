import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import PharmacyMedicinesList from "@/components/pharmacy/pharmacy-medicines-list"

export default async function PharmacyMedicinesPage() {
  const user = await getCurrentUser()

  if (!user || user.user_type !== "pharmacy") {
    redirect("/signin")
  }

  // Get pharmacy profile
  const pharmacyResult = await sql`
    SELECT p.id, p.pharmacy_name, p.verification_status
    FROM pharmacy_profiles p
    WHERE p.user_id = ${user.id}
  ` as any[]

  if (!pharmacyResult || pharmacyResult.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Pharmacy profile not found. Please complete your registration.</p>
        </div>
      </div>
    )
  }

  const pharmacy = pharmacyResult[0]

  if (pharmacy.verification_status !== "verified") {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">Your pharmacy is not yet verified. You can manage medicines once your profile is verified.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Medicines</h1>
          <p className="text-muted-foreground">
            Remove medicines from your store so they no longer show on the home page or customer listings.
          </p>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/pharmacy/publish-to-store">Publish to Store</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Medicines with stock in your verified pharmacy are shown below. Use remove to take them off the storefront.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You can always add them back later by publishing stock again.
          </p>
        </CardContent>
      </Card>

      <PharmacyMedicinesList />
    </div>
  )
}
