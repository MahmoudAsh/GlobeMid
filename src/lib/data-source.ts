/**
 * ============================================================================
 *  DATA SOURCE — the only file that knows where leave data comes from.
 * ============================================================================
 *
 *  The rest of the app only calls `loadLeaveData()` and works with the types in
 *  `types.ts`. We only ever READ the sheet; nothing is written back.
 *
 *  The sheet has three tabs (names configurable in SHEET_CONFIG):
 *    • "Weekly Requests"  Name | Request | Status | Annual | Week | Note
 *    • "FSRs"             the roster (only the name column is used)
 *    • "Aliases"          Name in requests | Correct name  (fixes spelling variants)
 *
 *  Where the data is read from is chosen at build time with VITE_DATA_SOURCE:
 *    • mock          (default) generated demo data in the same format as the sheet
 *    • csv-files     ./data/weekly-requests.csv, ./data/fsrs.csv, ./data/aliases.csv
 *                    next to index.html (handy for a private preview)
 *    • google-sheet  the live Google Sheet (see SHEET_CONFIG below)
 */
import { addDays, isAfter } from 'date-fns'
import { toKey } from './dates'
import { employeeId } from './ids'
import { mockSheet } from './mock-data'
import type { Employee, LeaveData, LeaveRequest, LeaveStatus, LeaveType } from './types'

type Source = 'mock' | 'csv-files' | 'google-sheet'
const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {}
const DATA_SOURCE = (env.VITE_DATA_SOURCE ?? 'mock') as Source

// ---------------------------------------------------------------------------
//  Google Sheet configuration
// ---------------------------------------------------------------------------
export const SHEET_CONFIG = {
  /** The long id in the sheet URL: docs.google.com/spreadsheets/d/<THIS>/edit */
  spreadsheetId: env.VITE_SHEET_ID ?? '',
  tabs: {
    requests: 'Weekly Requests',
    roster: 'FSRs',
    aliases: 'Aliases',
  },
}

/**
 * Sheet header (row 1) → field. Matching ignores case, line breaks and extra spaces.
 * Unlisted columns are ignored (e.g. the roster's "Address" column is never read).
 */
export const COLUMN_MAPPING = {
  requests: {
    Name: 'name',
    Request: 'request',
    Status: 'status',
    Annual: 'annual',
    Week: 'week',
    Note: 'note',
    Department: 'department',
  },
  roster: {
    'FSR Names': 'name',
    Name: 'name',
    Department: 'department',
  },
  aliases: {
    'Name in requests': 'from',
    'Correct name': 'to',
  },
} as const satisfies Record<string, Record<string, string>>

// ---------------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------------
export interface SheetTabs {
  requests: string[][]
  roster: string[][]
  aliases: string[][]
}

export async function loadLeaveData(): Promise<LeaveData> {
  const tabs = await loadTabs()
  return sheetToLeaveData(tabs)
}

async function loadTabs(): Promise<SheetTabs> {
  switch (DATA_SOURCE) {
    case 'mock':
      await new Promise((r) => setTimeout(r, 450)) // show the loading state briefly
      return mockSheet()
    case 'csv-files':
      return {
        requests: await fetchCsv('./data/weekly-requests.csv'),
        roster: await fetchCsv('./data/fsrs.csv', true),
        aliases: await fetchCsv('./data/aliases.csv', true),
      }
    case 'google-sheet': {
      const { spreadsheetId, tabs } = SHEET_CONFIG
      if (!spreadsheetId) throw new Error('Set VITE_SHEET_ID (the Google Sheet id) — see README')
      // The gviz endpoint exports one tab as CSV. The sheet must be shared as
      // "Anyone with the link can view". Status is a text column, so cell colours aren't needed.
      const url = (tab: string) =>
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`
      return {
        requests: await fetchCsv(url(tabs.requests)),
        roster: await fetchCsv(url(tabs.roster), true),
        aliases: await fetchCsv(url(tabs.aliases), true),
      }
    }
  }
}

async function fetchCsv(url: string, optional = false): Promise<string[][]> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return parseCsv(await res.text())
  } catch (e) {
    if (optional) return [] // roster / aliases tabs are optional
    throw new Error(`Couldn’t read ${url}: ${e instanceof Error ? e.message : e}`)
  }
}

// ---------------------------------------------------------------------------
//  Sheet rows → app data
// ---------------------------------------------------------------------------
type Row<K extends string> = Partial<Record<K, string>>

/** Read a tab into objects using a header → field mapping. */
function readTab<M extends Record<string, string>>(
  rows: string[][],
  mapping: M,
): (Row<M[keyof M]> & { __row: number })[] {
  const [header = [], ...body] = rows
  const norm = (h: string) => h.replace(/\s+/g, ' ').trim().toLowerCase()
  const lookup = new Map(Object.entries(mapping).map(([k, v]) => [norm(k), v]))
  const fields = header.map((h) => lookup.get(norm(h ?? '')))
  const out: (Row<M[keyof M]> & { __row: number })[] = []
  body.forEach((cells, rowIndex) => {
    const row: Row<M[keyof M]> = {}
    cells.forEach((value, col) => {
      const f = fields[col] as M[keyof M] | undefined
      const v = cleanText(value)
      if (f && v && !row[f]) row[f] = v
    })
    if (Object.keys(row).length) out.push({ ...row, __row: rowIndex + 2 }) // sheet row number (header is row 1)
  })
  return out
}

/** Collapse spaces / non-breaking spaces / line breaks. */
const cleanText = (s: string | undefined) => (s ?? '').replace(/[\s ]+/g, ' ').trim()
/** Key used to match names: lowercase letters only ("Mohamed  abd el raoof" ≈ "mohamedabdelraoof"). */
const nameKey = (s: string) => cleanText(s).toLowerCase().replace(/[^a-z؀-ۿ]/g, '')

export function sheetToLeaveData(tabs: SheetTabs, today = new Date()): LeaveData {
  const rows = readTab(tabs.requests, COLUMN_MAPPING.requests)
  const roster = readTab(tabs.roster, COLUMN_MAPPING.roster)
  const aliases = readTab(tabs.aliases, COLUMN_MAPPING.aliases)

  // --- names: alias → roster spelling ---
  const aliasTo = new Map(aliases.filter((a) => a.from && a.to).map((a) => [nameKey(a.from!), cleanText(a.to)]))
  const rosterByKey = new Map<string, Employee>()
  for (const r of roster) {
    if (!r.name) continue
    const name = cleanText(r.name)
    const key = nameKey(name)
    if (!rosterByKey.has(key)) rosterByKey.set(key, { id: employeeId(name), name, department: r.department, inRoster: true })
  }
  const spellings = new Map<string, Map<string, number>>() // key → spelling → count (for people not in the roster)
  const resolveName = (raw: string) => {
    const cleaned = cleanText(raw)
    const corrected = aliasTo.get(nameKey(cleaned)) ?? cleaned
    const key = nameKey(corrected)
    const counts = spellings.get(key) ?? new Map()
    counts.set(corrected, (counts.get(corrected) ?? 0) + 1)
    spellings.set(key, counts)
    return key
  }

  // --- weeks: the sheet writes "27-12 to 2-1" without a year ---
  const weeks = inferWeekDates(rows.map((r) => r.week ?? ''), today)

  const parsed: { key: string; raw: string; req: Omit<LeaveRequest, 'employee' | 'employeeId'> }[] = []
  const skippedRows: NonNullable<LeaveData['skippedRows']> = []
  rows.forEach((r, i) => {
    const week = weeks[i]
    if (!r.name || !week) {
      if (r.name || r.request)
        skippedRows.push({ row: r.__row, name: cleanText(r.name) || '—', reason: r.name ? 'noWeek' : 'noName' })
      return
    }
    const { type, days } = classifyRequest(r.request ?? '', r.annual ?? '', r.status ?? '')
    parsed.push({
      key: resolveName(r.name),
      raw: cleanText(r.name),
      req: {
        id: `ROW-${r.__row}`, // sheet row number, handy when cross-checking
        department: r.department,
        type,
        startDate: week.start,
        endDate: week.end,
        precision: 'week',
        days,
        reason: [r.request, r.note].filter(Boolean).join(' — '),
        status: parseStatus(r.status),
      },
    })
  })

  // --- employees: everyone in the roster + anyone who appears only in requests ---
  const employees = new Map(rosterByKey)
  for (const [key, counts] of spellings) {
    if (employees.has(key)) continue
    const name = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] // most common spelling
    employees.set(key, { id: employeeId(name), name, inRoster: false })
  }

  const requests: LeaveRequest[] = parsed.map(({ key, raw, req }) => {
    const e = employees.get(key)!
    return {
      ...req,
      employee: e.name,
      employeeRaw: raw !== e.name ? raw : undefined,
      employeeId: e.id,
      department: req.department ?? e.department,
    }
  })

  return {
    employees: [...employees.values()].sort((a, b) => a.name.localeCompare(b.name)),
    requests,
    skippedRows,
  }
}

/**
 * Turn "27-12 to 2-1" style week labels into dates. The year isn't written, so we walk the rows
 * from the newest (bottom) up: the last row gets the latest year that isn't far in the future,
 * and every time the month jumps up while going backwards (Jan → Dec) we step back a year.
 * This keeps working when the sheet continues into next year or old rows are deleted.
 */
export function inferWeekDates(labels: string[], today: Date): ({ start: string; end: string } | null)[] {
  const re = /(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*(?:to|-|–|—|إلى|الى)\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/i
  const out: ({ start: string; end: string } | null)[] = labels.map(() => null)
  const limit = addDays(today, 60)
  let year: number | null = null
  let nextMonth: number | null = null
  for (let i = labels.length - 1; i >= 0; i--) {
    const m = re.exec(labels[i])
    if (!m) continue
    const [sd, sm, ed, em] = m.slice(1).map(Number)
    if (sm < 1 || sm > 12 || em < 1 || em > 12) continue
    if (year === null) {
      year = today.getFullYear() + 1
      while (isAfter(new Date(year, sm - 1, sd), limit)) year--
    } else if (nextMonth !== null && sm > nextMonth + 6) {
      year-- // e.g. this row is December, the row below is January
    } else if (nextMonth !== null && sm < nextMonth - 6) {
      year++ // rows slightly out of order across New Year
    }
    nextMonth = sm
    const start = new Date(year, sm - 1, sd)
    const end = new Date(em < sm ? year + 1 : year, em - 1, ed)
    out[i] = { start: toKey(start), end: toKey(end < start ? addDays(start, 6) : end) }
  }
  return out
}

/**
 * Classify a free-text request and read its day count.
 * Days: the number in the "Annual" column (e.g. "2 Day"); for sick requests also a number
 * written in the text ("Out of schedule 3 Day ( Sick )"). Otherwise 0.
 */
export function classifyRequest(request: string, annual: string, status: string): { type: LeaveType; days: number } {
  const all = `${request} ${annual} ${status}`.toLowerCase()
  const num = (s: string) => {
    const m = /(\d+(?:[.,]\d+)?)\s*(?:day|days|يوم|ايام|أيام)/i.exec(s) ?? /^\s*(\d+(?:[.,]\d+)?)\b/.exec(s)
    return m ? Number(m[1].replace(',', '.')) : 0
  }
  let days = num(annual)

  let type: LeaveType
  if (/sick|مرض|تعبان/.test(all)) {
    type = 'Sick'
    if (!days) days = num(request)
  } else if (/birthday|brithday|bithday|عيد\s*ميلاد/.test(all)) type = 'Annual'
  else if (/holiday|official|\beid\b|عيد|رسمي|رسميه|شم\s*نسيم/.test(all)) type = 'Holiday'
  else if (days > 0 || /annual|anuual|anual|annaul|انيوال|سنوي|اعتيادي/.test(all)) type = 'Annual'
  else if (/training|out\s*side|ouside|meeting|تدريب/.test(all)) type = 'Training'
  else if (/shift|وردي/.test(all)) type = 'Shift'
  else if (/cancel/.test(all)) type = 'Other'
  else if (/\boff\b|راحة|راحه/.test(all)) type = 'DayOff'
  else type = 'Other'
  return { type, days }
}

/** Status column: Approved / Rejected; "Sick" and "Training" are recorded facts → approved; blank → pending. */
function parseStatus(v?: string): LeaveStatus {
  const s = (v ?? '').trim().toLowerCase()
  if (!s) return 'pending'
  if (s.startsWith('reject') || s === 'no' || s.includes('مرفوض')) return 'rejected'
  if (s.startsWith('approv') || s === 'yes' || s === 'sick' || s === 'training' || s.includes('مقبول')) return 'approved'
  return 'pending'
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

