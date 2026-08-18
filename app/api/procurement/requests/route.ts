import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { medicineRequests } from "@/lib/db/schema"

export async function POST(request: Request) { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json(); if (typeof body.medicineName !== "string" || body.medicineName.trim().length < 2) return NextResponse.json({ error: "Medicine name is required" }, { status: 400 }); const type = body.requestType === "out_of_stock" ? "out_of_stock" : "new"; const rows = await db.insert(medicineRequests).values({ pharmacyId: session.user.id, medicineName: body.medicineName.trim(), requestType: type, quantity: Number.isInteger(body.quantity) ? body.quantity : null, notes: typeof body.notes === "string" ? body.notes.trim() : null }).returning({ id: medicineRequests.id }); return NextResponse.json({ ok: true, id: rows[0]?.id }, { status: 201 }) }
