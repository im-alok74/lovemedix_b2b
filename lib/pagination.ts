export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function paginate<T>(items: T[], page: number, limit: number): PaginationResult<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.max(1, Math.min(page, totalPages))
  const start = (safePage - 1) * limit
  const end = start + limit

  return {
    items: items.slice(start, end),
    total,
    page: safePage,
    limit,
    totalPages,
  }
}
