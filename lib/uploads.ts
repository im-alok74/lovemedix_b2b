import { v2 as cloudinary } from 'cloudinary'

let configured = false

export function cloudinaryReady(): boolean {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
  return true
}

export interface UploadResult {
  url: string
  bytes: number
  format: string
  originalName: string
}

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']

export async function uploadDocument(file: File, folder: string): Promise<UploadResult> {
  if (file.size > MAX_BYTES) throw new Error('File exceeds 8 MB')
  if (file.type && !ALLOWED.includes(file.type)) throw new Error('Only PDF or image files are allowed')

  const buffer = Buffer.from(await file.arrayBuffer())

  const result = await new Promise<{ secure_url: string; bytes: number; format: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: process.env[folder] || folder, resource_type: 'auto', access_mode: 'authenticated' },
        (err, res) => (err || !res ? reject(err ?? new Error('Upload failed')) : resolve(res as never)),
      )
      .end(buffer)
  })

  return { url: result.secure_url, bytes: result.bytes, format: result.format, originalName: file.name }
}
