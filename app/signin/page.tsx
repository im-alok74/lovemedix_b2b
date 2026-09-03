import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getCurrentUser, roleHome } from '@/lib/auth'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignInForm } from '@/components/auth/signin-form'

export const metadata = { title: 'Sign in' }

export default async function SignInPage() {
  const user = await getCurrentUser()
  if (user) redirect(roleHome(user.role))

  return (
    <AuthShell
      title="Sign in to Lovemedix"
      subtitle="Access your pharmacy, distributor or admin console."
      footer={
        <>
          New to Lovemedix?{' '}
          <Link href="/get-started" className="font-medium text-primary hover:underline">
            Register your business
          </Link>
        </>
      }
    >
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  )
}
