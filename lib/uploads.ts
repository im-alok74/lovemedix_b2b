import { v2 as cloudinary } from 'cloudinary'

let configured = false

export function cloudinaryReady(): boolean {
  const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  const hasParts = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
  if (!CLOUDINARY_URL && !hasParts) return false
  if (!configured) {
    // With CLOUDINARY_URL set, config() reads it from the environment itself.
    cloudinary.config(
      CLOUDINARY_URL
        ? { secure: true }
        : {
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
            secure: true,
          },
    )
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

export async function uploadDocument(file: File, folder = 'lovemedix/documents'): Promise<UploadResult> {
  if (file.size > MAX_BYTES) throw new Error('File exceeds 8 MB')
  if (file.type && !ALLOWED.includes(file.type)) throw new Error('Only PDF or image files are allowed')

  const buffer = Buffer.from(await file.arrayBuffer())

  // PDFs deliver reliably as `raw`; images keep `image` so they render inline for
  // the reviewer. public_id is Cloudinary-random, so links are unguessable.
  const resourceType = file.type.startsWith('image/') ? 'image' : 'raw'

  const result = await new Promise<{ secure_url: string; bytes: number; format?: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: process.env.CLOUDINARY_DOCUMENTS_FOLDER || folder, resource_type: resourceType }, (err, res) => {
        if (err || !res) {
          const message =
            (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message) ||
            'Cloudinary upload failed'
          console.error('[uploads] cloudinary error:', err)
          reject(new Error(message))
          return
        }
        resolve(res as never)
      })
      .end(buffer)
  })

  return { url: result.secure_url, bytes: result.bytes, format: result.format ?? '', originalName: file.name }
}
