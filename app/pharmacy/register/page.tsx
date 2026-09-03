import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getCurrentUser, roleHome } from '@/lib/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { PharmacyRegisterForm } from '@/components/auth/pharmacy-register-form'

export const metadata = { title: 'Register your pharmacy' }

export default async function PharmacyRegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect(roleHome(user.role))

  return (
    <AuthShell
      wide
      title="Register your pharmacy"
      subtitle="Create your account, then upload your drug licence and GST for verification. Approval is usually within a business day."
      footer={
        <>
          Are you a distributor?{' '}
          <Link href="/distributor/register" className="font-medium text-primary hover:underline">
            Register as a distributor
          </Link>
        </>
      }
    >
      <PharmacyRegisterForm />
    </AuthShell>
  )
}
