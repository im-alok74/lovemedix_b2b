import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// Pharmacy marketplace view of distributor stock - includes both in-stock and out-of-stock items
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "pharmacy") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = (searchParams.get("q") || "").trim()
    const category = searchParams.get("category") || ""
    const distributorId = searchParams.get("distributorId")
    const includeOutOfStock = searchParams.get("includeOutOfStock") === "true"

    const qLike = `%${query.toLowerCase()}%`

    // Get in-stock items (available for purchase)
    const inStockResults = await sql`
      SELECT
        dm.id,
        dm.distributor_id,
        dp.company_name AS distributor_name,
        dm.medicine_id,
        m.name,
        m.generic_name,
        m.manufacturer,
        m.category,
        m.form,
        m.strength,
        m.pack_size,
        m.image_url,
        dm.batch_number,
        dm.expiry_date,
        dm.mrp,
        dm.unit_price,
        dm.quantity,
        dm.reserved_quantity,
        (dm.quantity - dm.reserved_quantity) AS available_quantity,
        'in_stock' as stock_status
      FROM distributor_medicines dm
      JOIN distributor_profiles dp ON dm.distributor_id = dp.id
      JOIN medicines m ON dm.medicine_id = m.id
      WHERE (dm.quantity - dm.reserved_quantity) > 0
        AND dm.expiry_date > NOW()
        AND (${query === ""} OR (
          LOWER(m.name) LIKE ${qLike}
          OR LOWER(m.generic_name) LIKE ${qLike}
          OR LOWER(m.manufacturer) LIKE ${qLike}
        ))
        AND (${category === ""} OR m.category = ${category})
        AND (${distributorId === null} OR dm.distributor_id = ${distributorId})
      ORDER BY m.name ASC, dm.unit_price ASC
    `

    let results: any[] = inStockResults

    // If requested, also get out-of-stock items (available for pre-order/request)
    if (includeOutOfStock) {
      const outOfStockResults = await sql`
        SELECT DISTINCT
          dm.id,
          dm.distributor_id,
          dp.company_name AS distributor_name,
          dm.medicine_id,
          m.name,
          m.generic_name,
          m.manufacturer,
          m.category,
          m.form,
          m.strength,
          m.pack_size,
          m.image_url,
          dm.batch_number,
          dm.expiry_date,
          dm.mrp,
          dm.unit_price,
          dm.quantity,
          dm.reserved_quantity,
          (dm.quantity - dm.reserved_quantity) AS available_quantity,
          'out_of_stock' as stock_status
        FROM distributor_medicines dm
        JOIN distributor_profiles dp ON dm.distributor_id = dp.id
        JOIN medicines m ON dm.medicine_id = m.id
        WHERE (dm.quantity - dm.reserved_quantity) <= 0
          AND (${query === ""} OR (
            LOWER(m.name) LIKE ${qLike}
            OR LOWER(m.generic_name) LIKE ${qLike}
            OR LOWER(m.manufacturer) LIKE ${qLike}
          ))
          AND (${category === ""} OR m.category = ${category})
          AND (${distributorId === null} OR dm.distributor_id = ${distributorId})
        ORDER BY m.name ASC, dm.unit_price ASC
      `
      results = [...inStockResults, ...outOfStockResults]
    }

    // Fetch all images for all medicines in a single optimized query
    const medicineIds = [...new Set((results as any[]).map(item => item.medicine_id))]
    
    let allImages: any[] = []
    if (medicineIds.length > 0) {
      // Fetch all images in one query instead of N+1 queries
      allImages = await sql`
        SELECT medicine_id, image_url FROM medicine_images 
        WHERE medicine_id = ANY(${medicineIds}::int[])
        ORDER BY medicine_id ASC, created_at ASC
      `
    }
    
    // Group images by medicine_id
    const imagesByMedicineId = new Map<number, string[]>()
    for (const img of allImages as any[]) {
      if (!imagesByMedicineId.has(img.medicine_id)) {
        imagesByMedicineId.set(img.medicine_id, [])
      }
      imagesByMedicineId.get(img.medicine_id)!.push(img.image_url)
    }
    
    // Attach images to each item
    const itemsWithImages = (results as any[]).map(item => ({
      ...item,
      images: imagesByMedicineId.get(item.medicine_id) || [],
    }))

    return NextResponse.json({ items: itemsWithImages })
  } catch (error: any) {
    console.error("[PROCUREMENT INVENTORY] Error:", error)
    return NextResponse.json(
      { error: "Failed to load procurement inventory", details: String(error) },
      { status: 500 }
    )
  }
}

