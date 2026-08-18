import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { profiles } from "@/lib/db/schema"

export async function POST(request: Request) { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json(); const role = body.role === "distributor" ? "distributor" : body.role === "pharmacy" ? "pharmacy" : null; if (!role || typeof body.businessName !== "string" || body.businessName.trim().length < 2) return NextResponse.json({ error: "Business details are required" }, { status: 400 }); await db.insert(profiles).values({ id: session.user.id, role, businessName: body.businessName.trim(), approvalStatus: "pending" }).onConflictDoUpdate({ target: profiles.id, set: { role, businessName: body.businessName.trim(), approvalStatus: "pending" } }); return NextResponse.json({ ok: true }) }
