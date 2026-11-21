/** Helpers shared by the Pages Functions (Cloudflare runtime). */

// Minimal Cloudflare types so we don't need @cloudflare/workers-types.
export interface D1Result<T> {
  results: T[]
  meta?: { last_row_id?: number }
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run(): Promise<D1Result<never>>
  first<T = Record<string, unknown>>(): Promise<T | null>
}
export interface D1Database {
  prepare(sql: string): D1PreparedStatement
  exec(sql: string): Promise<unknown>
}
export interface Env {
  /** D1 binding — add it in Cloudflare Pages → Settings → Bindings (variable name: DB). */
  DB?: D1Database
  /** Secret — Cloudflare Pages → Settings → Variables and Secrets (name: MANAGER_PASSWORD). */
  MANAGER_PASSWORD?: string
}
export interface Ctx<P extends string = never> {
  request: Request
  env: Env
  params: Record<P, string>
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

/** Creates the table on first use, so no manual migration step is needed. Same SQL as migrations/0001. */
export async function ensureTable(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        days REAL NOT NULL,
        leave_type TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    )
    .run()
}

/** Constant-time-ish comparison of the manager password. */
export function checkPassword(env: Env, request: Request): 'ok' | 'missing-secret' | 'wrong' {
  const expected = env.MANAGER_PASSWORD ?? ''
  if (!expected) return 'missing-secret'
  const given = request.headers.get('x-manager-password') ?? ''
  let diff = given.length ^ expected.length
  for (let i = 0; i < Math.max(given.length, expected.length); i++) diff |= (given.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0)
  return diff === 0 ? 'ok' : 'wrong'
}

export interface Row {
  id: number
  employee: string
  start_date: string
  end_date: string
  days: number
  leave_type: string
  reason: string
  status: string
  created_at: string
}

export const toRecord = (r: Row) => ({
  id: r.id,
  employee: r.employee,
  startDate: r.start_date,
  endDate: r.end_date,
  days: r.days,
  leaveType: r.leave_type,
  reason: r.reason,
  status: r.status,
  createdAt: r.created_at,
})
