import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ShieldCheck, TrendingUp, Users, ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Lovemedix — B2B Pharmaceutical Marketplace',
  description: 'The B2B platform connecting verified pharmacies with approved distributors for wholesale medicine procurement.',
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Building2 className="h-4 w-4" />
                B2B Pharmaceutical Procurement
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Connect. Procure. <span className="text-primary">Grow.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                The trusted B2B platform for pharmacies and distributors. Bulk procurement, verified partners, and streamlined inventory management.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/pharmacy/register">
                    Register Pharmacy <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/distributor/register">
                    Register Distributor <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-6">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin">Already have an account? Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built for B2B pharmaceutical trade
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to manage procurement, inventory, and partner relationships.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Verified Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Every pharmacy and distributor undergoes document verification before accessing the platform.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Bulk Procurement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Place bulk orders directly from distributors with transparent pricing and batch tracking.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Inventory Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Full shop management with customer tracking, purchase records, sales, and billing.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <Building2 className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Demand Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Request medicines not on the platform or currently out of stock directly from distributors.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">1</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Register & Verify</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign up as a pharmacy or distributor. Submit your business documents for admin verification.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">2</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Access Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once approved, access your role-specific dashboard with all the tools you need.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-bold">3</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Trade & Grow</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse medicines, place bulk orders, manage inventory, and grow your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
              <h2 className="text-3xl font-bold tracking-tight">Ready to get started?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join the B2B pharmaceutical procurement platform trusted by pharmacies and distributors across India.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/pharmacy/register">
                    Register as Pharmacy <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/distributor/register">
                    Register as Distributor <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-6">
                <Button variant="link" asChild>
                  <Link href="/signin">Sign in to existing account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
