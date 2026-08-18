import { neon, neonConfig, Pool, type PoolClient } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

function normalizeConnectionString(raw: string): string {
  return raw
    .trim()
    // Tolerate someone pasting the full `psql '...'` command from the Neon console.
    .replace(/^psql\s+/, "")
    .replace(/^['"]|['"]$/g, "")
}

const connectionString = normalizeConnectionString(process.env.DATABASE_URL)

/**
 * HTTP-based query function. One round trip per query, no session state.
 * Use this for reads and for isolated single-statement writes.
 */
export const sql = neon(connectionString)

/**
 * Same query function, but lets the caller name the row shape:
 *
 *   const rows = await query<Medicine>`SELECT ... FROM medicines`
 *
 * Postgres results are unchecked at runtime either way — this just moves the assertion
 * to one obvious place per call instead of an `as unknown as T[]` at every call site.
 * Reach for zod parsing on top when a row crosses a trust boundary.
 */
export const query = sql as unknown as <T = Record<string, any>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>

// The Pool talks over WebSockets, which is what makes real interactive transactions
// possible. Node 22+ and every edge runtime expose a global WebSocket.
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket
}

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString })
  }
  return pool
}

/**
 * Runs `fn` inside a real BEGIN/COMMIT block, rolling back on any thrown error.
 *
 * Required for anything that must be all-or-nothing — placing an order writes to
 * `orders`, `order_items` and `pharmacy_inventory`, and a partial write there means
 * either stock vanishes without an order or an order exists against stock that was
 * never reserved.
 *
 * The callback receives a tagged-template `query` function with the same ergonomics
 * as the exported `sql`, so call sites read identically inside and outside a
 * transaction.
 */
export async function withTransaction<T>(
  fn: (query: TransactionQuery, client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect()

  try {
    await client.query("BEGIN")
    const result = await fn(makeTransactionQuery(client), client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    try {
      await client.query("ROLLBACK")
    } catch (rollbackError) {
      console.error("[db] ROLLBACK failed:", rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export type TransactionQuery = <R = Record<string, any>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<R[]>

function makeTransactionQuery(client: PoolClient): TransactionQuery {
  return async function query<R = Record<string, any>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<R[]> {
    // Rebuild the template as a parameterized statement: $1, $2, ... No interpolation
    // of raw values into SQL text, so this is injection-safe by construction.
    const text = strings.reduce(
      (acc, part, index) => acc + part + (index < values.length ? `$${index + 1}` : ""),
      "",
    )
    const result = await client.query(text, values as any[])
    return result.rows as R[]
  }
}
