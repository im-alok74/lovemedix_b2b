import Link from "next/link"
import { redirect } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Home, Package, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { getCurrentUser } from "@/lib/auth-server"

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: any
}) {
  const params = typeof searchParams?.then === "function" ? await searchParams : searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect("/signin")
  }

  const orderId = params?.orderId

  if (!orderId) {
    redirect("/orders")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-linear-to-b from-background via-muted/10 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="overflow-hidden border-2 border-primary/20 bg-card/95 shadow-lg">
                <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 text-center sm:p-8">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                  <CardHeader className="px-0 pb-0 pt-4">
                    <CardTitle className="text-3xl font-bold text-foreground">Order placed successfully</CardTitle>
                  </CardHeader>
                  <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                    Your trusted medicine order is confirmed. We’re preparing everything for a smooth delivery experience.
                  </p>
                </div>

                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 text-center">
                    <p className="text-sm text-muted-foreground">Order reference</p>
                    <p className="mt-2 text-2xl font-bold text-primary">{orderId}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-background p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Package className="h-4 w-4 text-primary" />
                        Order processing
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Your medicines are being packed carefully for dispatch.</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Phone className="h-4 w-4 text-primary" />
                        Delivery confirmation
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">A quick call will confirm the address and delivery window.</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Home className="h-4 w-4 text-primary" />
                        Quick arrival
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Most orders reach your address within a short, reliable window.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="flex-1 gap-2">
                      <Link href="/orders">
                        View my orders
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 bg-transparent">
                      <Link href="/">Continue shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
