import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { v2 as cloudinary } from "cloudinary"

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("[MEDICINE IMAGE UPLOAD] Cloudinary env vars are not fully configured")
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "davaa/medicines",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )
      stream.end(buffer)
    })

    const url = (uploadResult as any).secure_url as string
    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error("[MEDICINE IMAGE UPLOAD] Error:", error)
    return NextResponse.json(
      { error: "Failed to upload image", details: String(error) },
      { status: 500 }
    )
  }
}

