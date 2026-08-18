import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"
import { BottomNav } from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { JsonLd } from "@/components/seo/json-ld"
import { organizationJsonld, websiteJsonld } from "@/lib/seo"
import { SITE, absoluteUrl } from "@/lib/site"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  // Exposed as a CSS variable so globals.css can point --font-sans at the real font
  // instead of the Geist family that was declared but never loaded.
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    // Child pages set only their own title; the brand suffix is appended here.
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "online pharmacy India",
    "buy medicines online",
    "medicine home delivery",
    "prescription medicines online",
    "generic medicine substitutes",
    "order medicine online",
    SITE.name,
  ],
  authors: [{ name: SITE.legalName }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  alternates: { canonical: absoluteUrl("/") },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: "en_IN",
    images: [{ url: absoluteUrl("/og-default.png"), width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [absoluteUrl("/og-default.png")],
  },
  // Every entry here points at a file that exists. The previous list named
  // icon-light-32x32.png and icon-dark-32x32.png, neither of which was ever in public/,
  // so the browser fell back to a 404 and the site had no favicon at all. The
  // light/dark pair is gone rather than recreated: the mark is a white glyph on brand
  // teal and reads correctly on both.
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: true, address: false, email: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Sitewide structured data. Emitted once here rather than per page so the
            Organization and WebSite nodes have a single stable @id to reference. */}
        <JsonLd data={organizationJsonld()} id="ld-organization" />
        <JsonLd data={websiteJsonld()} id="ld-website" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* Keyboard users land here first; it stays invisible until focused. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        {children}
        {/* Sits outside the page tree so every storefront route gets the same mobile
            navigation without each one remembering to render it. It hides itself on the
            seller consoles and during checkout. */}
        <BottomNav />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
