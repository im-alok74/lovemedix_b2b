import { signOut } from "@/lib/auth-server"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    await signOut()
    // Build an absolute URL so Next doesn't complain about relative URLs
    const redirectUrl = new URL("/", request.url)

    // If the request likely comes from JS (fetch/XHR) return JSON with redirect path
    const accept = request.headers.get("accept") || ""
    const xRequestedWith = request.headers.get("x-requested-with") || ""

    if (accept.includes("application/json") || xRequestedWith === "XMLHttpRequest") {
      // Tell the client where to go, but don't redirect from the API itself
      return NextResponse.json({ success: true, redirectTo: redirectUrl.pathname })
    }

    // Otherwise perform a normal HTTP redirect using an absolute URL
    return NextResponse.redirect(redirectUrl, { status: 302 })
  } catch (error) {
    console.error("[v0] Signout error:", error)
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 })
  }
}
