import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { profiles } from "@/lib/db/schema"
import { PortalShell } from "@/components/portal-shell"

export default async function PortalPage() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) redirect("/sign-in"); const profile = await db.select().from(profiles).where(eq(profiles.id, session.user.id)).limit(1); const current = profile[0]; if (!current || current.approvalStatus !== "approved") redirect("/pending-approval"); const role = current.role === "admin" || current.role === "distributor" ? current.role : "pharmacy"; return <PortalShell name={session.user.name} email={session.user.email} role={role} /> }
