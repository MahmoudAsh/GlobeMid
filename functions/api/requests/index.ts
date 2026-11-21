/**
 * GET  /api/requests  → every leave request added from the dashboard (public, like the dashboard itself)
 * POST /api/requests  → add one (needs the manager password in the `x-manager-password` header)
 */
import { validateNewRequest } from '../../../src/lib/app-requests/validate'
import { checkPassword, ensureTable, json, toRecord, type Ctx, type Row } from '../../_shared'

export async function onRequestGet({ env }: Ctx) {
  if (!env.DB) return json({ error: 'not-configured' }, 503)
  await ensureTable(env.DB)
  const { results } = await env.DB.prepare('SELECT * FROM leave_requests ORDER BY start_date, id').all<Row>()
  return json({ requests: results.map(toRecord) })
}

export async function onRequestPost({ env, request }: Ctx) {
  if (!env.DB) return json({ error: 'not-configured' }, 503)
  const auth = checkPassword(env, request)
  if (auth === 'missing-secret') return json({ error: 'password-not-set' }, 503)
  if (auth === 'wrong') return json({ error: 'wrong-password' }, 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid', errors: ['body'] }, 400)
  }
  const v = validateNewRequest(body)
  if (!v.ok) return json({ error: 'invalid', errors: v.errors }, 400)

  await ensureTable(env.DB)
  const r = v.value
  const createdAt = new Date().toISOString()
  const row = await env.DB.prepare(
    `INSERT INTO leave_requests (employee, start_date, end_date, days, leave_type, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(r.employee, r.startDate, r.endDate, r.days, r.leaveType, r.reason, r.status, createdAt)
    .first<Row>()
  return json({ request: row ? toRecord(row) : null }, 201)
}
