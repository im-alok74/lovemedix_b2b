import { neon } from "@neondatabase/serverless"

/**
 * Edge-safe session lookup for middleware.
 *
 * Deliberately does NOT import lib/auth-server: that module pulls in bcryptjs and
 * next/headers, neither of which belong in the Edge runtime. This file imports only
 * the Neon HTTP driver, which runs anywhere.
 *
 * Returns just the fields middleware needs to route — never the whole user row.
 */

export const SESSION_COOKIE = "session_token"

export type EdgeSession = {
  userId: number
  userType: "customer" | "pharmacy" | "distributor" | "admin"
}

function getSql() {
  const raw = process.env.DATABASE_URL
  if (!raw) throw new Error("DATABASE_URL environment variable is not set")
  return neon(raw.trim().replace(/^psql\s+/, "").replace(/^['"]|['"]$/g, ""))
}

export async function getSessionFromToken(token: string | undefined): Promise<EdgeSession | null> {
  if (!token) return null

  try {
    const sql = getSql()
    const rows = await sql`
      SELECT u.id, u.user_type
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${token}
        AND s.expires_at > NOW()
        AND u.status = 'active'
      LIMIT 1
    `

    if (rows.length === 0) return null

    return {
      userId: Number(rows[0].id),
      userType: rows[0].user_type as EdgeSession["userType"],
    }
  } catch (error) {
    // Never let a transient DB error lock every user out of the site. Callers treat
    // null as "not signed in", which redirects to /signin rather than 500ing.
    console.error("[auth-edge] session lookup failed:", error)
    return null
  }
}
