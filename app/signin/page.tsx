import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignInForm } from '@/components/auth/signin-form'

export const metadata = {
  title: 'Sign In | Davaa B2B',
}

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    const home = user.role === 'ADMIN' ? '/admin' : user.role === 'PHARMACY' ? '/pharmacy/dashboard' : '/distributor/dashboard'
    redirect(home)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center bg-muted/30 py-12">
        <div className="container px-4">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your B2B account</CardDescription>
            </CardHeader>
            <CardContent>
              <SignInForm />
            </CardContent>
          </Card>
          <div className="mx-auto mt-6 max-w-md text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/get-started" className="text-primary hover:underline">
                Get started
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
