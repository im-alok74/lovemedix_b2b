"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SITE } from "@/lib/site"

/**
 * Root error boundary.
 *
 * Shows the digest, not the message: `error.message` is scrubbed in production builds
 * anyway, and the digest is what lets support correlate a customer report with the real
 * stack trace in the server logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This one is on us, not you. Try again — if it keeps happening, get in touch and we will
          look into it.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>

        {error.digest ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Reference: <code className="rounded bg-muted px-1 py-0.5">{error.digest}</code>
            <br />
            Quote this if you contact{" "}
            <a href={`mailto:${SITE.contact.email}`} className="text-primary hover:underline">
              {SITE.contact.email}
            </a>
            .
          </p>
        ) : null}
      </div>
    </div>
  )
}
