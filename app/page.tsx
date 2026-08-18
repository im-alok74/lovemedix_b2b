import Link from "next/link"
import { ArrowRight, Building2, ClipboardCheck, FileText, PackageCheck, ShieldCheck, Truck } from "lucide-react"

const capabilities = [
  { icon: PackageCheck, title: "Verified medicine catalog", text: "Source active, compliant inventory uploaded directly by approved distributors." },
  { icon: Truck, title: "Bulk procurement", text: "Build wholesale orders with transparent pricing, tax, stock and fulfillment status." },
  { icon: FileText, title: "Demand requests", text: "Raise new-medicine or out-of-stock requests and track the response from your network." },
  { icon: ClipboardCheck, title: "Approval-led access", text: "Every pharmacy and distributor is reviewed before the platform unlocks its panel." },
]

export default function HomePage() {
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-background/95">
      <div className="page-container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span><span>LoveMedix <span className="text-muted-foreground">B2B</span></span></Link>
        <nav className="flex items-center gap-3"><Link href="/sign-in" className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">Sign in</Link><Link href="/register" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Register business</Link></nav>
      </div>
    </header>
    <section className="border-b border-border bg-muted/30">
      <div className="page-container grid gap-12 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-28">
        <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground"><Building2 className="size-4 text-primary" /> Built for India&apos;s medicine supply chain</div><h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl">Wholesale medicines, with trust built in.</h1><p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">LoveMedix connects verified pharmacies with approved distributors so teams can buy in bulk, request hard-to-find medicines, and run their shop with one dependable workspace.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground">Get started <ArrowRight className="size-4" /></Link><Link href="/sign-in" className="rounded-md border border-border bg-background px-5 py-3 font-semibold">Sign in to your panel</Link></div></div>
        <div className="surface p-6 shadow-sm"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-sm text-muted-foreground">Platform status</p><p className="mt-1 font-semibold">Verified network</p></div><span className="rounded-full bg-success/15 px-3 py-1 text-sm font-medium text-success">Approval led</span></div><div className="space-y-5 py-6"><div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><ShieldCheck className="size-5" /></span><div><p className="font-medium">Documents reviewed</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Business licenses, GST and registration documents are reviewed by admin.</p></div></div><div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><PackageCheck className="size-5" /></span><div><p className="font-medium">One connected workflow</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Catalog, purchasing, requests, invoices and pharmacy ledger in one place.</p></div></div></div></div>
      </div>
    </section>
    <section className="page-container py-16"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">A better operating system</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Everything your medicine business needs to move with confidence.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{capabilities.map(({ icon: Icon, title, text }) => <article key={title} className="surface p-5"><Icon className="size-6 text-primary" /><h3 className="mt-6 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></section>
    <section className="border-t border-border bg-primary py-14 text-primary-foreground"><div className="page-container flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><h2 className="text-2xl font-semibold">Ready to join the verified network?</h2><p className="mt-2 text-primary-foreground/75">Register your pharmacy or distribution business for admin approval.</p></div><Link href="/register" className="inline-flex items-center gap-2 self-start rounded-md bg-primary-foreground px-5 py-3 font-semibold text-primary">Register your business <ArrowRight className="size-4" /></Link></div></section>
  </main>
}
