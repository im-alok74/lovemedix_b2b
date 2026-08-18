import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

async function updateInventory(formData: FormData) {
  "use server"

  const user = await getCurrentUser()
  if (!user || user.user_type !== "distributor") {
    redirect("/signin")
  }

  const inventoryId = Number(formData.get("inventory_id"))
  const quantity = Number(formData.get("quantity"))
  const wholesalePrice = Number(formData.get("wholesale_price"))
  const expiryDate = String(formData.get("expiry_date") || "")
  const imageUrl = String(formData.get("image_url") || "").trim()

  if (Number.isNaN(inventoryId) || Number.isNaN(quantity) || Number.isNaN(wholesalePrice)) {
    throw new Error("Invalid inventory update payload")
  }

  const distributorProfile = await sql`
    SELECT id, verification_status FROM distributor_profiles WHERE user_id = ${user.id}
  `

  if (distributorProfile.length === 0 || (distributorProfile[0] as any).verification_status !== "verified") {
    redirect("/distributor/inventory")
  }

  const inventoryItem = await sql`
    SELECT dm.id, dm.medicine_id, dm.expiry_date, dm.notes
    FROM distributor_medicines dm
    WHERE dm.id = ${inventoryId} AND dm.distributor_id = ${(distributorProfile[0] as any).id}
    LIMIT 1
  `

  if (inventoryItem.length === 0) {
    redirect("/distributor/inventory")
  }

  const amount = quantity * wholesalePrice

  await sql`
    UPDATE distributor_medicines
    SET quantity = ${quantity},
        unit_price = ${wholesalePrice},
        amount = ${amount},
        expiry_date = ${expiryDate || (inventoryItem[0] as any).expiry_date},
        updated_at = NOW()
    WHERE id = ${inventoryId}
  `

  if (imageUrl) {
    await sql`
      UPDATE medicines
      SET image_url = ${imageUrl}
      WHERE id = ${(inventoryItem[0] as any).medicine_id}
    `

    await sql`
      INSERT INTO medicine_images (medicine_id, image_url, source)
      VALUES (${(inventoryItem[0] as any).medicine_id}, ${imageUrl}, 'distributor')
    `
  }

  redirect("/distributor/inventory?updated=true")
}

export default async function DistributorInventoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user || user.user_type !== "distributor") {
    redirect("/signin")
  }

  const { id } = await params
  const inventoryId = Number(id)

  if (Number.isNaN(inventoryId)) {
    redirect("/distributor/inventory")
  }

  const distributorProfile = await sql`
    SELECT id, verification_status FROM distributor_profiles WHERE user_id = ${user.id}
  `

  if (distributorProfile.length === 0 || (distributorProfile[0] as any).verification_status !== "verified") {
    redirect("/distributor/inventory")
  }

  const item = await sql`
    SELECT
      dm.id,
      dm.medicine_id,
      dm.quantity,
      dm.unit_price,
      dm.amount,
      dm.expiry_date,
      dm.notes,
      m.name,
      m.generic_name,
      m.manufacturer,
      m.form,
      m.strength,
      m.image_url
    FROM distributor_medicines dm
    JOIN medicines m ON dm.medicine_id = m.id
    WHERE dm.id = ${inventoryId} AND dm.distributor_id = ${(distributorProfile[0] as any).id}
    LIMIT 1
  `

  if (item.length === 0) {
    redirect("/distributor/inventory")
  }

  const medicine = item[0] as any

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/5 py-8">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/distributor/inventory">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Inventory Item</h1>
              <p className="text-muted-foreground mt-1">Update stock and medicine image</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6 grid gap-4 rounded-lg border bg-muted/40 p-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Medicine</p>
                <p className="font-medium">{medicine.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Generic</p>
                <p className="font-medium">{medicine.generic_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manufacturer</p>
                <p className="font-medium">{medicine.manufacturer || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Form / Strength</p>
                <p className="font-medium">{medicine.form || "-"} {medicine.strength ? `• ${medicine.strength}` : ""}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Image</p>
                <p className="truncate font-medium">{medicine.image_url || "No image set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Amount</p>
                <p className="font-medium">₹{Number(medicine.amount || 0).toFixed(2)}</p>
              </div>
            </div>

            <form action={updateInventory} className="space-y-6">
              <input type="hidden" name="inventory_id" value={medicine.id} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="quantity">
                    Stock Quantity
                  </label>
                  <Input id="quantity" name="quantity" type="number" min="0" defaultValue={Number(medicine.quantity || 0)} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="wholesale_price">
                    Wholesale Price (₹)
                  </label>
                  <Input id="wholesale_price" name="wholesale_price" type="number" step="0.01" min="0" defaultValue={Number(medicine.unit_price || 0).toFixed(2)} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="expiry_date">
                    Expiry Date
                  </label>
                  <Input id="expiry_date" name="expiry_date" type="date" defaultValue={medicine.expiry_date ? String(medicine.expiry_date).slice(0, 10) : ""} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="image_url">
                    Medicine Image URL
                  </label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    placeholder="https://..."
                    defaultValue={medicine.image_url || ""}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit">Update Inventory</Button>
                <Button variant="outline" asChild>
                  <Link href="/distributor/inventory">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}