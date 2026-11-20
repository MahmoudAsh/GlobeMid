/**
 * Aggregations shared by every page, so Overview, Employees and the Employee report always agree.
 */
import { eachMonthOfInterval, endOfMonth } from 'date-fns'
import { CATEGORIES } from './categories'
import { fmt, formatWeek, fromKey, toKey } from './dates'
import { inRange, type Period, type WeekRange } from './periods'
import type { Category, Employee, LeaveRow, RowStatus } from './types'

export interface RowFilters {
  category: Category | null
  status: RowStatus | null
}

export function filterRows(rows: LeaveRow[], range: WeekRange | null, f: RowFilters) {
  return rows.filter(
    (r) => inRange(r.weekKey, range) && (!f.category || r.categories.includes(f.category)) && (!f.status || r.status === f.status),
  )
}

export interface Summary {
  rows: number
  approved: number
  rejected: number
  notMarked: number
  /** Annual days (Annual column) — exact. */
  annualDays: number
  people: number
  /** Per category: rows that include it, and days (annual: exact; others: approx.). */
  byCategory: Record<Category, { count: number; days: number }>
}

export function summarize(rows: LeaveRow[]): Summary {
  const s: Summary = {
    rows: rows.length,
    approved: 0,
    rejected: 0,
    notMarked: 0,
    annualDays: 0,
    people: new Set(rows.map((r) => r.employeeId)).size,
    byCategory: Object.fromEntries(CATEGORIES.map((c) => [c, { count: 0, days: 0 }])) as Summary['byCategory'],
  }
  for (const r of rows) {
    if (r.status === 'approved') s.approved++
    else if (r.status === 'rejected') s.rejected++
    else s.notMarked++
    s.annualDays += r.annualDays
    for (const c of r.categories) {
      s.byCategory[c].count++
      s.byCategory[c].days += c === 'annual' ? r.annualDays : r.otherDays
    }
  }
  return s
}

export interface EmployeeStats extends Employee {
  summary: Summary
  /** Approx. days. */
  sickDays: number
  holidayDays: number
  /** Row counts. */
  birthdays: number
  offChanges: number
  cancelledOffs: number
  /** Annual days computed from the FSR counter start date (all filters ignored) — compare with fsrAnnualUsed. */
  computedAnnualUsed: number
  fsrMismatch: boolean
  lastWeek: string | null
}

export function employeeStats(
  employees: Employee[],
  scopedRows: LeaveRow[],
  allRows: LeaveRow[],
  fsrCounterStart: string,
): EmployeeStats[] {
  const group = (rows: LeaveRow[]) => {
    const m = new Map<string, LeaveRow[]>()
    for (const r of rows) m.set(r.employeeId, [...(m.get(r.employeeId) ?? []), r])
    return m
  }
  const scoped = group(scopedRows)
  const all = group(allRows)
  return employees.map((e) => {
    const rows = scoped.get(e.id) ?? []
    const summary = summarize(rows)
    const computedAnnualUsed = (all.get(e.id) ?? []).filter((r) => r.weekKey >= fsrCounterStart).reduce((n, r) => n + r.annualDays, 0)
    return {
      ...e,
      summary,
      sickDays: summary.byCategory.sick.days,
      holidayDays: summary.byCategory.publicHoliday.days,
      birthdays: summary.byCategory.birthday.count,
      offChanges: summary.byCategory.dayOff.count,
      cancelledOffs: summary.byCategory.cancelledOff.count,
      computedAnnualUsed,
      fsrMismatch: e.fsrAnnualUsed != null && e.fsrAnnualUsed !== computedAnnualUsed,
      lastWeek: rows.reduce<string | null>((m, r) => (!m || r.weekKey > m ? r.weekKey : m), null),
    }
  })
}

export interface Bucket {
  key: string
  label: string
  title: string
  start: string
  end: string
  annualDays: number
  rows: number
}

/** Annual days per month (year / all), per sheet week (month), or for the one week (week). */
export function annualBuckets(rows: LeaveRow[], period: Period, range: WeekRange | null, sheetWeeks: string[]): Bucket[] {
  let buckets: Bucket[]
  if (period === 'week' || period === 'month') {
    const weeks = sheetWeeks.filter((w) => inRange(w, range))
    buckets = weeks.map((w) => {
      const s = fromKey(w)
      const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6)
      return { key: w, label: fmt(s, 'd MMM'), title: formatWeek(s, e), start: w, end: w, annualDays: 0, rows: 0 }
    })
  } else {
    const start = range?.start ?? sheetWeeks[0]
    const end = range?.end ?? sheetWeeks.at(-1)
    if (!start || !end) return []
    const multiYear = start.slice(0, 4) !== end.slice(0, 4)
    buckets = eachMonthOfInterval({ start: fromKey(start), end: fromKey(end) }).map((m) => ({
      key: toKey(m),
      label: fmt(m, multiYear ? 'MMM yy' : 'MMM'),
      title: fmt(m, 'MMMM yyyy'),
      start: toKey(m),
      end: toKey(endOfMonth(m)),
      annualDays: 0,
      rows: 0,
    }))
  }
  for (const r of rows) {
    const b = buckets.find((x) => r.weekKey >= x.start && r.weekKey <= x.end)
    if (!b) continue
    b.annualDays += r.annualDays
    b.rows++
  }
  return buckets
}
