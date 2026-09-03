import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getCurrentUser, roleHome } from '@/lib/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { DistributorRegisterForm } from '@/components/auth/distributor-register-form'

export const metadata = { title: 'Become a distributor' }

export default async function DistributorRegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect(roleHome(user.role))

  return (
    <AuthShell
      wide
      title="Become a Lovemedix distributor"
      subtitle="Create your account, then upload your wholesale drug licence and GST for verification."
      footer={
        <>
          Are you a pharmacy?{' '}
          <Link href="/pharmacy/register" className="font-medium text-primary hover:underline">
            Register as a pharmacy
          </Link>
        </>
      }
    >
      <DistributorRegisterForm />
    </AuthShell>
  )
}
