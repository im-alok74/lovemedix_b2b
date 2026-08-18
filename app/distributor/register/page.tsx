import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DistributorSignUpForm } from "@/components/auth/distributor-signup-form"
import { CheckCircle2, TrendingUp, Users, Zap, Building2, ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Distributor Registration | Davaa.in",
  description: "Register as a pharmaceutical distributor and expand your business with Davaa.in",
}

export default function DistributorRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.1),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,1))] py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Building2 className="h-4 w-4" />
                  Distributor onboarding
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Join as a distributor</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Expand your network with a platform built for wholesale medicine distribution and faster partner collaboration.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Coverage</p>
                  <p className="mt-1 font-semibold text-foreground">Pan-India</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Support</p>
                  <p className="mt-1 font-semibold text-foreground">Fast review</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Trust</p>
                  <p className="mt-1 font-semibold text-foreground">Verified partners</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <DistributorSignUpForm />
              </CardContent>
            </Card>

            <div className="flex flex-col justify-center space-y-6">
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-foreground">Why partner with us?</h2>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">Increase revenue</h3>
                        <p className="text-sm text-muted-foreground">Reach more pharmacies and customers across India.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">Large customer base</h3>
                        <p className="text-sm text-muted-foreground">Connect with a growing ecosystem of pharmacies and retailers.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">Simple platform</h3>
                        <p className="text-sm text-muted-foreground">Manage inventory and orders from one streamlined dashboard.</p>
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
                      <span>Service area coverage</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-amber-900">
                    <ShieldCheck className="h-5 w-5" />
                    <h3 className="font-semibold">Document verification</h3>
                  </div>
                  <p className="mt-2 text-sm text-amber-800">
                    After registration, your documents will be reviewed and verified within a couple of business days.
                  </p>
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
