/** DELETE /api/requests/:id → remove a request added by mistake (manager password required). */
import { checkPassword, ensureTable, json, type Ctx } from '../../_shared'

export async function onRequestDelete({ env, request, params }: Ctx<'id'>) {
  if (!env.DB) return json({ error: 'not-configured' }, 503)
  const auth = checkPassword(env, request)
  if (auth === 'missing-secret') return json({ error: 'password-not-set' }, 503)
  if (auth === 'wrong') return json({ error: 'wrong-password' }, 401)
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'invalid' }, 400)
  await ensureTable(env.DB)
  await env.DB.prepare('DELETE FROM leave_requests WHERE id = ?').bind(id).run()
  return json({ deleted: id })
}
