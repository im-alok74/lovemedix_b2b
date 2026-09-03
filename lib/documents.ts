import prisma from '@/lib/prisma'

type Owner =
  | { kind: 'PHARMACY'; pharmacyProfileId: number; userId: number }
  | { kind: 'DISTRIBUTOR'; distributorProfileId: number; userId: number }

export interface DocumentInput {
  documentType: 'DRUG_LICENSE' | 'GST_CERTIFICATE' | 'BUSINESS_REGISTRATION' | 'ADDRESS_PROOF' | 'IDENTITY_PROOF' | 'OTHER'
  fileName: string
  fileUrl: string
  fileSize?: number | null
  mimeType?: string | null
  expiresAt?: string | null
}

export async function addDocument(owner: Owner, input: DocumentInput) {
  const doc = await prisma.document.create({
    data: {
      ownerType: owner.kind,
      pharmacyProfileId: owner.kind === 'PHARMACY' ? owner.pharmacyProfileId : null,
      distributorProfileId: owner.kind === 'DISTRIBUTOR' ? owner.distributorProfileId : null,
      documentType: input.documentType,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize ?? null,
      mimeType: input.mimeType ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      verificationStatus: 'PENDING',
    },
  })

  // A fresh upload on a rejected profile moves it back into the review queue.
  if (owner.kind === 'PHARMACY') {
    await prisma.pharmacyProfile.updateMany({
      where: { id: owner.pharmacyProfileId, verificationStatus: 'REJECTED' },
      data: { verificationStatus: 'PENDING', rejectionReason: null },
    })
  } else {
    await prisma.distributorProfile.updateMany({
      where: { id: owner.distributorProfileId, verificationStatus: 'REJECTED' },
      data: { verificationStatus: 'PENDING', rejectionReason: null },
    })
  }

  await prisma.auditLog.create({
    data: { actorId: owner.userId, action: 'document.upload', entityType: 'Document', entityId: String(doc.id) },
  })
  return doc
}

export async function deleteDocument(documentId: number, ownerUserId: number) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      pharmacyProfile: { select: { userId: true } },
      distributorProfile: { select: { userId: true } },
    },
  })
  if (!doc) return { ok: false as const, error: 'Not found', status: 404 }

  const ownerId = doc.pharmacyProfile?.userId ?? doc.distributorProfile?.userId
  if (ownerId !== ownerUserId) return { ok: false as const, error: 'Not your document', status: 403 }
  if (doc.verificationStatus === 'VERIFIED') {
    return { ok: false as const, error: 'Verified documents cannot be removed', status: 409 }
  }
  await prisma.document.delete({ where: { id: documentId } })
  return { ok: true as const }
}
