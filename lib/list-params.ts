export interface ListParams {
  page: number
  limit: number
  skip: number
  search: string
  status: string
  sort: string
}

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams

function read(params: RawParams, key: string): string {
  if (params instanceof URLSearchParams) return params.get(key) ?? ''
  const v = params[key]
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export function parseListParams(params: RawParams, opts?: { limit?: number; maxLimit?: number }): ListParams {
  const defaultLimit = opts?.limit ?? 20
  const maxLimit = opts?.maxLimit ?? 100
  const page = Math.max(1, Number.parseInt(read(params, 'page'), 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(read(params, 'limit'), 10) || defaultLimit))
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search: read(params, 'q').trim().slice(0, 120),
    status: read(params, 'status').trim().toUpperCase().slice(0, 40),
    sort: read(params, 'sort').trim().slice(0, 40),
  }
}

export function pageMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
}
