/**
 * Weekly Requests CSV (+ FSR list + aliases) → normalized LeaveData.
 * Pure function — the same code runs on the bundled CSV, the live Google Sheet CSV and in tests.
 */
import { format } from 'date-fns'
import type { Category, DataIssues, Employee, LeaveData, LeaveRow } from '../types'
import { parseAnnualCell } from './annual'
import { approxDays, classifyRequest } from './classifier'
import { csvToObjects } from './csv'
import { createNameResolver, employeeId, nameKey, normalizeName } from './names'
import { mapStatus } from './status'
import { isSaturday, resolveWeeks } from './weeks'

export interface ParseOptions {
  /** Year of the FIRST week in the sheet (the sheet never writes years). */
  baseYear: number
  aliases: Record<string, string>
}

const REQUEST_COLUMNS = {
  row: ['Row'],
  name: ['Name'],
  request: ['Request'],
  status: ['Status'],
  annual: ['Annual'],
  week: ['Week'],
  note: ['Note'],
  rowColor: ['RowColor', 'Row Color'],
}
const FSR_COLUMNS = { name: ['Name', 'FSR Names', 'FSR Name'], annualUsed: ['Annual Used'] }

export function parseFsrCsv(text: string) {
  return csvToObjects(text, FSR_COLUMNS)
    .map((r) => {
      const n = Number(r.annualUsed.trim())
      return { name: normalizeName(r.name), annualUsed: r.annualUsed.trim() !== '' && Number.isFinite(n) ? n : null }
    })
    .filter((r) => r.name)
}

export function parseWeeklyRequests(requestsCsv: string, fsrCsv: string, opts: ParseOptions): LeaveData {
  const raw = csvToObjects(requestsCsv, REQUEST_COLUMNS)
  const fsr = parseFsrCsv(fsrCsv)
  const resolve = createNameResolver(opts.aliases, fsr.map((f) => f.name))
  // Canonical names chosen in name-aliases.json are known people even when they aren't FSRs.
  const aliasTargets = new Set(Object.values(opts.aliases).map(nameKey))
  // `Row` column when present (our export); otherwise the position in the sheet (header = row 1).
  const rowNo = (r: (typeof raw)[number]) => Number(r.row) || r.__index + 2

  const issues: DataIssues = { unparsedWeeks: [], nonSaturdayWeeks: [], emptyNameRows: [], unmatchedNames: [], unclassified: [] }
  const rawStatusCounts: Record<string, number> = {}
  for (const r of raw) {
    const s = r.status.trim() || '(empty)'
    rawStatusCounts[s] = (rawStatusCounts[s] ?? 0) + 1
  }

  // Rows with no name are placeholders (e.g. an empty "8-3 to 14-3" week) — skip them before
  // year inference, but keep their weeks out of the chronology too.
  const named = raw.filter((r) => {
    if (normalizeName(r.name)) return true
    issues.emptyNameRows.push({ row: rowNo(r), week: r.week.trim() })
    return false
  })
  const weeks = resolveWeeks(
    named.map((r) => r.week),
    opts.baseYear,
  )

  const rows: LeaveRow[] = []
  const unmatched = new Map<string, { name: string; count: number; rows: number[] }>()
  const unclassified = new Map<string, { text: string; count: number; rows: number[] }>()
  const variants = new Map<string, Map<string, number>>()
  const people = new Map<string, { name: string; inFsrList: boolean }>()

  named.forEach((r, i) => {
    const id = rowNo(r)
    const rawName = normalizeName(r.name)
    const week = weeks[i]
    if (!week) {
      issues.unparsedWeeks.push({ row: id, name: rawName, week: r.week.trim() })
      return
    }
    const weekKey = format(week.start, 'yyyy-MM-dd')
    if (!isSaturday(week.start)) {
      issues.nonSaturdayWeeks.push({ row: id, weekLabel: r.week.trim(), start: weekKey })
      if (import.meta.env?.DEV) console.warn(`[sheet] row ${id}: week "${r.week}" starts on ${weekKey}, not a Saturday`)
    }

    const person = resolve(rawName)
    if (!person.inFsrList && !person.aliased && !aliasTargets.has(person.key)) {
      const u = unmatched.get(person.key) ?? { name: person.canonical, count: 0, rows: [] }
      u.count++
      u.rows.push(id)
      unmatched.set(person.key, u)
    }
    const v = variants.get(person.key) ?? new Map<string, number>()
    v.set(rawName, (v.get(rawName) ?? 0) + 1)
    variants.set(person.key, v)
    if (!people.has(person.key)) people.set(person.key, { name: person.canonical, inFsrList: person.inFsrList })

    const { status, forcedCategory } = mapStatus(r.status, r.rowColor)
    const annual = parseAnnualCell(r.annual)
    const requestText = normalizeName(r.request)
    const cls = classifyRequest({
      text: requestText,
      annualDays: annual.annualDays,
      annualCellIsSick: annual.isSick,
      forcedCategory,
    })
    if (cls.unclassified) {
      const key = requestText.toLowerCase() || '(empty)'
      const u = unclassified.get(key) ?? { text: requestText || '(empty)', count: 0, rows: [] }
      u.count++
      u.rows.push(id)
      unclassified.set(key, u)
    }

    const hasOther = cls.categories.some((c: Category) => c !== 'annual')
    const otherDays = hasOther ? (annual.isSick && annual.sickDays != null ? annual.sickDays : approxDays(requestText)) : 0
    const rejected = status === 'rejected'

    rows.push({
      id,
      source: 'sheet',
      rawName,
      employee: person.canonical,
      employeeId: employeeId(person.canonical),
      inFsrList: person.inFsrList,
      weekStart: week.start,
      weekEnd: week.end,
      weekKey,
      weekLabel: r.week.trim(),
      requestText,
      categories: cls.categories,
      primaryCategory: cls.primary,
      status,
      annualDays: rejected ? 0 : annual.annualDays,
      otherDays: rejected ? 0 : otherDays,
      annualCell: normalizeName(r.annual),
      note: normalizeName(r.note),
    })
  })

  issues.unmatchedNames = [...unmatched.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  issues.unclassified = [...unclassified.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
  if (import.meta.env?.DEV && issues.unclassified.length) {
    console.info('[sheet] unclassified request texts (add keywords in src/lib/sheet/classifier.ts):', issues.unclassified)
  }

  // Everyone in the FSR list (even with zero rows) + everyone else who appears in the sheet.
  const employees: Employee[] = []
  const seen = new Set<string>()
  for (const f of fsr) {
    const key = nameKey(f.name)
    if (seen.has(key)) continue
    seen.add(key)
    employees.push({ id: employeeId(f.name), name: f.name, inFsrList: true, fsrAnnualUsed: f.annualUsed, variants: [] })
  }
  for (const [key, p] of people) {
    if (seen.has(key)) continue
    seen.add(key)
    employees.push({ id: employeeId(p.name), name: p.name, inFsrList: false, fsrAnnualUsed: null, variants: [] })
  }
  for (const e of employees) {
    const v = variants.get(nameKey(e.name))
    e.variants = v ? [...v.entries()].map(([raw, count]) => ({ raw, count })).sort((a, b) => b.count - a.count) : []
  }
  employees.sort((a, b) => a.name.localeCompare(b.name))

  return {
    rows,
    employees,
    issues,
    sheetWeeks: [...new Set(rows.map((r) => r.weekKey))].sort(),
    rawStatusCounts,
    rawRowCount: raw.length,
    app: { available: false, count: 0 },
  }
}
