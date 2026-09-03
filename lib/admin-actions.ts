import prisma from '@/lib/prisma'

const TX_OPTS = { maxWait: 10_000, timeout: 20_000 } as const

type ProfileKind = 'pharmacy' | 'distributor'
export type VerificationAction = 'approve' | 'reject' | 'suspend' | 'reinstate'

/**
 * Single place the admin panel changes a pharmacy/distributor approval state, so the
 * audit log, notification and user-status side effects stay consistent.
 */
export async function setProfileVerification(
  kind: ProfileKind,
  profileId: number,
  action: VerificationAction,
  adminId: number,
  reason?: string | null,
) {
  const now = new Date()

  const profile =
    kind === 'pharmacy'
      ? await prisma.pharmacyProfile.findUnique({ where: { id: profileId }, select: { userId: true } })
      : await prisma.distributorProfile.findUnique({ where: { id: profileId }, select: { userId: true } })
  if (!profile) throw new Error('Profile not found')

  const data =
    action === 'approve'
      ? { verificationStatus: 'VERIFIED' as const, verifiedAt: now, verifiedBy: adminId, rejectionReason: null }
      : action === 'reject'
        ? { verificationStatus: 'REJECTED' as const, verifiedAt: now, verifiedBy: adminId, rejectionReason: reason ?? null }
        : null

  await prisma.$transaction(async (tx) => {
    if (data) {
      if (kind === 'pharmacy') await tx.pharmacyProfile.update({ where: { id: profileId }, data })
      else await tx.distributorProfile.update({ where: { id: profileId }, data })
    }
    if (action === 'suspend') {
      await tx.user.update({ where: { id: profile.userId }, data: { status: 'SUSPENDED' } })
      await tx.session.deleteMany({ where: { userId: profile.userId } })
    }
    if (action === 'reinstate') {
      await tx.user.update({ where: { id: profile.userId }, data: { status: 'ACTIVE' } })
    }
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: `${kind}.${action}`,
        entityType: kind === 'pharmacy' ? 'PharmacyProfile' : 'DistributorProfile',
        entityId: String(profileId),
        metadata: reason ? { reason } : undefined,
      },
    })
    await tx.notification.create({
      data: {
        userId: profile.userId,
        type: `account.${action}`,
        title:
          action === 'approve'
            ? 'Your account has been approved'
            : action === 'reject'
              ? 'Your registration needs attention'
              : action === 'suspend'
                ? 'Your account has been suspended'
                : 'Your account has been reinstated',
        body: reason ?? null,
        link: kind === 'pharmacy' ? '/pharmacy/dashboard' : '/distributor/dashboard',
      },
    })
  }, TX_OPTS)
}

export async function setDocumentVerification(
  documentId: number,
  action: 'verify' | 'reject',
  adminId: number,
  reason?: string | null,
) {
  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: action === 'verify' ? 'VERIFIED' : 'REJECTED',
        verifiedAt: now,
        verifiedBy: adminId,
        rejectionReason: action === 'reject' ? reason ?? null : null,
      },
    })
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: `document.${action}`,
        entityType: 'Document',
        entityId: String(documentId),
        metadata: reason ? { reason } : undefined,
      },
    })
  }, TX_OPTS)
}
