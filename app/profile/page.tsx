import Link from "next/link"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user || user.user_type !== "customer") {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,1))]">
        <div className="container mx-auto px-4 py-8 lg:py-10">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Your account</p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">My Profile</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Review your details, stay on top of orders, and keep your delivery preference ready.
              </p>
            </div>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/orders">View orders</Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" />
                      Personalized account
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{user.full_name}</h2>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                      Your profile is ready for faster checkout and smoother order tracking.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-background/80 p-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm text-muted-foreground">Account type</p>
                    <p className="mt-1 font-semibold text-foreground">{user.user_type}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm text-muted-foreground">Current status</p>
                    <div className="mt-1 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="font-semibold text-foreground">{user.status}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Need help with an order? We keep your account details handy so support can resolve requests faster.
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4">
                  <span className="font-medium text-foreground">Delivery ready</span>
                  <Badge variant="secondary">Always on</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Account details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Full name</p>
                  <p className="mt-1 font-semibold text-foreground">{user.full_name}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="mt-1 font-semibold text-foreground">{user.email}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="mt-1 font-semibold text-foreground">{user.phone || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/medicines" className="block rounded-2xl border border-border/70 bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5">
                  <p className="font-medium text-foreground">Browse medicines</p>
                  <p className="mt-1 text-sm text-muted-foreground">Continue shopping with your trusted essentials.</p>
                </Link>
                <Link href="/orders" className="block rounded-2xl border border-border/70 bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5">
                  <p className="font-medium text-foreground">Track previous orders</p>
                  <p className="mt-1 text-sm text-muted-foreground">Jump back into your recent purchase history.</p>
                </Link>
                <Link href="/addresses" className="block rounded-2xl border border-border/70 bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5">
                  <p className="font-medium text-foreground">Manage addresses</p>
                  <p className="mt-1 text-sm text-muted-foreground">Keep delivery locations ready for faster checkout.</p>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
