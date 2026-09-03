import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, conflict, handleApiError, ok } from '@/lib/api-response'
import { categorySchema, safeParse } from '@/lib/validation'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const parsed = safeParse(categorySchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data
    const slug = slugify(d.name)

    if (await prisma.category.findFirst({ where: { OR: [{ name: d.name }, { slug }] } })) {
      return conflict('A category with that name already exists')
    }

    const category = await prisma.category.create({
      data: {
        name: d.name,
        slug,
        description: d.description || null,
        displayOrder: d.displayOrder ?? 0,
        isActive: d.isActive ?? true,
      },
    })
    return ok(category, 201)
  } catch (error) {
    return handleApiError(error, 'admin/categories POST')
  }
}
