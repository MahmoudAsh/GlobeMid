/**
 * ============================================================================
 *  DATA SOURCE — the only place that knows where the data comes from.
 * ============================================================================
 *
 *  1. The "Weekly Requests" sheet:
 *     • Default: the CSV bundled in src/data/weekly-requests.csv.
 *     • Live: set VITE_SHEET_CSV_URL to the sheet's CSV export, e.g.
 *         https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Weekly%20Requests
 *  2. Requests added from the dashboard ("Add leave request"), stored in Cloudflare D1 and read
 *     from /api/requests (functions/api/requests). If that API isn't available (local `npm run dev`,
 *     or D1 not bound yet) the dashboard still works with the sheet alone.
 *
 *  The FSR list (src/data/fsrs.csv) and name fixes (src/data/name-aliases.json) are bundled.
 */
import aliases from '@/data/name-aliases.json'
import fsrCsv from '@/data/fsrs.csv?raw'
import bundledCsv from '@/data/weekly-requests.csv?raw'
import { mergeAppRequests } from './app-requests/to-rows'
import type { AppLeaveRecord, NewLeaveRequest } from './app-requests/validate'
import { SHEET_CONFIG } from './config'
import { parseWeeklyRequests } from './sheet/parse'
import type { LeaveData } from './types'

const SHEET_CSV_URL = import.meta.env?.VITE_SHEET_CSV_URL as string | undefined
const API = '/api/requests'

export async function loadLeaveData(): Promise<LeaveData> {
  let csv = bundledCsv
  if (SHEET_CSV_URL) {
    const res = await fetch(SHEET_CSV_URL)
    if (!res.ok) throw new Error(`Couldn’t read the Google Sheet (${res.status} ${res.statusText})`)
    csv = await res.text()
  }
  const sheet = parseWeeklyRequests(csv, fsrCsv, { baseYear: SHEET_CONFIG.baseYear, aliases })
  const app = await fetchAppRequests()
  return app ? mergeAppRequests(sheet, app) : sheet
}

/** null when the API isn't there (no Pages Function / no D1 binding). */
async function fetchAppRequests(): Promise<AppLeaveRecord[] | null> {
  try {
    const res = await fetch(API, { headers: { accept: 'application/json' } })
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    const body = (await res.json()) as { requests?: AppLeaveRecord[] }
    return Array.isArray(body.requests) ? body.requests : null
  } catch {
    return null
  }
}

export type ApiError = 'wrong-password' | 'password-not-set' | 'not-configured' | 'invalid' | 'network'

async function call(method: 'POST' | 'DELETE', url: string, password: string, body?: unknown): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json', 'x-manager-password': password },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (res.ok) return { ok: true }
    const data = (await res.json().catch(() => ({}))) as { error?: ApiError }
    return { ok: false, error: data.error ?? (res.status === 404 ? 'not-configured' : 'network') }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export const addLeaveRequest = (req: NewLeaveRequest, password: string) => call('POST', API, password, req)
export const deleteLeaveRequest = (appId: number, password: string) => call('DELETE', `${API}/${appId}`, password)
