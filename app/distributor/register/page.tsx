import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { DistributorRegisterForm } from '@/components/auth/distributor-register-form'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ShieldCheck, Building2 } from 'lucide-react'

export const metadata = {
  title: 'Distributor Registration | Davaa B2B',
}

export default function DistributorRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Building2 className="h-4 w-4" />
              Distributor partnership
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Register as a distributor
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Supply medicines to pharmacies across the network and grow your wholesale business.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <DistributorRegisterForm />
              </CardContent>
            </Card>

            <div className="flex flex-col justify-center space-y-6">
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-foreground">Why partner with us?</h2>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">Increase revenue</h3>
                        <p className="text-sm text-muted-foreground">Reach more pharmacies and expand your distribution network.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">Bulk orders</h3>
                        <p className="text-sm text-muted-foreground">Receive bulk procurement requests from verified pharmacies.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">Verified platform</h3>
                        <p className="text-sm text-muted-foreground">All partners are verified for secure and trustworthy transactions.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Requirements</h2>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span>Valid wholesale license</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span>GST registration</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span>Business address and contact details</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span>Document verification (1-2 business days)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
