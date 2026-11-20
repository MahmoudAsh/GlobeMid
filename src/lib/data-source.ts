/**
 * ============================================================================
 *  DATA SOURCE — the only file that knows where leave data comes from.
 * ============================================================================
 *
 *  The rest of the app only calls `loadLeaveData()` and works with the types in
 *  `types.ts`. To switch from mock data to the real Google Sheet, change
 *  `DATA_SOURCE`, fill in `SHEET_CONFIG` and adjust `COLUMN_MAPPING` to the
 *  sheet's header row. Nothing outside this file needs to change.
 *
 *  We only ever READ the sheet. Nothing is written back.
 */
import { isValid, parse } from 'date-fns'
import { normalizeLeaveType } from './constants'
import { toKey, workingDaysBetween } from './dates'
import { employeeId } from './ids'
import { mockEmployees, mockRequests } from './mock-data'
import type { Employee, LeaveData, LeaveRequest, LeaveStatus } from './types'

/** 'mock' today; switch to 'google-sheet' once the sheet is shared. */
const DATA_SOURCE = 'mock' as 'mock' | 'google-sheet'

// ---------------------------------------------------------------------------
//  Google Sheet configuration (placeholder — fill in when the sheet is shared)
// ---------------------------------------------------------------------------
export const SHEET_CONFIG = {
  /** The long id in the sheet URL: docs.google.com/spreadsheets/d/<THIS>/edit */
  spreadsheetId: '',
  /** Tab that holds the leave requests. */
  sheetName: 'Leave Requests',
  /** Optional tab with the full employee list (so people with no requests still show). */
  employeesSheetName: '' as string,
  /**
   * Only needed for the Sheets API v4 (option b below). Use a browser API key
   * restricted to the Sheets API and to this site's domain.
   */
  apiKey: '',
}

/**
 * Sheet header (exactly as written in row 1) → field on `LeaveRequest`.
 * Matching ignores case and surrounding spaces. Unlisted columns are ignored.
 */
export const COLUMN_MAPPING: Record<string, keyof RawRow> = {
  'Employee Name': 'employee',
  Department: 'department',
  'Leave Type': 'type',
  'Start Date': 'startDate',
  'End Date': 'endDate',
  'Number of Days': 'days',
  Reason: 'reason',
  Notes: 'reason',
  Status: 'status', // only if option (a) below is chosen
  Timestamp: 'submittedAt', // Google Forms adds this automatically
}

/** Date formats tried, in order, when reading date cells from the sheet. */
const DATE_FORMATS = ['yyyy-MM-dd', 'd/M/yyyy', 'M/d/yyyy', 'd-M-yyyy', 'd MMM yyyy', 'M/d/yyyy H:mm:ss']

// ---------------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------------
export async function loadLeaveData(): Promise<LeaveData> {
  if (DATA_SOURCE === 'google-sheet') return loadFromGoogleSheet()

  // Mock: simulate a short network delay so loading states are visible.
  await new Promise((r) => setTimeout(r, 450))
  return { employees: mockEmployees, requests: mockRequests }
}

// ---------------------------------------------------------------------------
//  Google Sheet integration (placeholder)
// ---------------------------------------------------------------------------
/**
 * TODO(google-sheet): implement once the sheet is shared.
 *
 * IMPORTANT — status lives in cell COLOURS today (green = approved,
 * red = rejected, no colour = pending), and a CSV export does NOT include
 * colours. Pick one:
 *
 *  (a) Add a "Status" column to the sheet (Approved / Rejected / Pending).
 *      Then the public CSV export is enough:
 *        const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
 *        const rows = parseCsv(await (await fetch(url)).text())
 *        return rowsToLeaveData(rows)
 *      (The sheet must be shared as "Anyone with the link can view".)
 *
 *  (b) Keep the colours and read them through the Google Sheets API v4:
 *        GET https://sheets.googleapis.com/v4/spreadsheets/{id}
 *            ?includeGridData=true&ranges={sheetName}
 *            &fields=sheets.data.rowData.values(formattedValue,effectiveFormat.backgroundColor)
 *            &key={apiKey}
 *      For each row take `formattedValue`s as the cell texts, and pass
 *      `colorToStatus(effectiveFormat.backgroundColor)` of the row (e.g. the
 *      name cell, or the first coloured cell) as `rowStatuses`:
 *        return rowsToLeaveData(rows, rowStatuses)
 */
async function loadFromGoogleSheet(): Promise<LeaveData> {
  throw new Error('Google Sheet integration is not configured yet — see src/lib/data-source.ts')
}

/**
 * TODO(google-sheet, option b): map a Sheets API background colour to a status.
 * Google returns { red, green, blue } in 0–1 (missing channels mean 0; white = no colour).
 * Thresholds may need tuning to the exact greens/reds the reviewer uses.
 */
export function colorToStatus(c?: { red?: number; green?: number; blue?: number }): LeaveStatus {
  if (!c) return 'pending'
  const r = c.red ?? 0
  const g = c.green ?? 0
  const b = c.blue ?? 0
  if (r > 0.95 && g > 0.95 && b > 0.95) return 'pending' // white / no fill
  if (g > r + 0.1 && g > b) return 'approved'
  if (r > g + 0.1 && r > b) return 'rejected'
  return 'pending'
}

// ---------------------------------------------------------------------------
//  Row → LeaveRequest mapping (ready to use for either option)
// ---------------------------------------------------------------------------
interface RawRow {
  employee: string
  department: string
  type: string
  startDate: string
  endDate: string
  days: string
  reason: string
  status: string
  submittedAt: string
}

/**
 * Turn sheet rows (first row = headers) into app data.
 * `rowStatuses[i]` (option b) overrides the status of data row i.
 */
export function rowsToLeaveData(rows: string[][], rowStatuses?: (LeaveStatus | undefined)[]): LeaveData {
  const [header = [], ...body] = rows
  const mapping = new Map(
    Object.entries(COLUMN_MAPPING).map(([k, v]) => [k.trim().toLowerCase(), v] as const),
  )
  const fieldAt = header.map((h) => mapping.get(h.trim().toLowerCase()))

  const requests: LeaveRequest[] = []
  body.forEach((cells, i) => {
    const raw: Partial<RawRow> = {}
    cells.forEach((value, col) => {
      const f = fieldAt[col]
      if (f && value?.trim() && !raw[f]) raw[f] = value.trim()
    })
    const startDate = parseSheetDate(raw.startDate)
    const endDate = parseSheetDate(raw.endDate) ?? startDate
    if (!raw.employee || !startDate || !endDate) return // skip blank / malformed rows

    const sheetDays = raw.days ? Number(raw.days.replace(',', '.')) : NaN
    requests.push({
      id: `ROW-${i + 2}`, // sheet row number, handy when cross-checking
      employee: raw.employee,
      employeeId: employeeId(raw.employee),
      department: raw.department,
      type: normalizeLeaveType(raw.type ?? ''),
      startDate,
      endDate,
      // Use the sheet's day count when present, otherwise working days excl. Fri/Sat.
      days: Number.isFinite(sheetDays) && sheetDays > 0 ? sheetDays : workingDaysBetween(startDate, endDate),
      reason: raw.reason ?? '',
      status: rowStatuses?.[i] ?? parseStatus(raw.status),
      submittedAt: parseSheetDate(raw.submittedAt),
    })
  })

  return { employees: deriveEmployees(requests), requests }
}

function parseStatus(v?: string): LeaveStatus {
  const s = (v ?? '').trim().toLowerCase()
  if (s.startsWith('approv') || s === 'yes' || s === 'accepted') return 'approved'
  if (s.startsWith('reject') || s === 'no' || s === 'declined') return 'rejected'
  return 'pending'
}

function parseSheetDate(v?: string): string | undefined {
  if (!v) return undefined
  for (const f of DATE_FORMATS) {
    const d = parse(v, f, new Date())
    if (isValid(d)) return toKey(d)
  }
  return undefined
}

/**
 * Employees from the requests. If an employees tab exists, merge it in here so that
 * people with zero requests are listed too.
 */
function deriveEmployees(requests: LeaveRequest[], roster: Employee[] = []): Employee[] {
  const map = new Map<string, Employee>(roster.map((e) => [e.id, e]))
  for (const r of requests) {
    if (!map.has(r.employeeId)) map.set(r.employeeId, { id: r.employeeId, name: r.employee, department: r.department })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Minimal CSV parser (handles quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const endCell = () => {
    row.push(cell)
    cell = ''
  }
  const endRow = () => {
    endCell()
    rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') endCell()
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      endRow()
    } else cell += ch
  }
  if (cell || row.length) endRow()
  return rows
}
