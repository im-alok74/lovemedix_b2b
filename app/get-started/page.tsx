import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PharmacyRegisterForm } from '@/components/auth/pharmacy-register-form'
import { DistributorRegisterForm } from '@/components/auth/distributor-register-form'
import { SignInForm } from '@/components/auth/signin-form'
import { Store, Building2 } from 'lucide-react'

export const metadata = {
  title: 'Get Started | Lovemedix',
}

export default async function GetStartedPage() {
  const user = await getCurrentUser()

  if (user) {
    const home = user.role === 'ADMIN' ? '/admin' : user.role === 'PHARMACY' ? '/pharmacy/dashboard' : '/distributor/dashboard'
    redirect(home)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Get Started</h1>
              <p className="mt-2 text-muted-foreground">
                Create an account or sign in to access the B2B procurement platform.
              </p>
            </div>

            <Tabs defaultValue="signin" className="mt-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
                <TabsTrigger value="distributor">Distributor</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card>
                  <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<div className="space-y-4">Loading...</div>}>
                      <SignInForm />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pharmacy">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-primary" />
                      <CardTitle>Register as Pharmacy</CardTitle>
                    </div>
                    <CardDescription>List your pharmacy and start procuring medicines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PharmacyRegisterForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="distributor">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle>Register as Distributor</CardTitle>
                    </div>
                    <CardDescription>Supply medicines to pharmacies across the network</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DistributorRegisterForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
