/**
 * Pure aggregation helpers. Every page uses these same functions so the
 * numbers on Overview, Employees and the Employee report always agree.
 */
import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
} from 'date-fns'
import { LEAVE_TYPES, WEEK_STARTS_ON } from './constants'
import { dayAllocation, fmt, daysInRange, fromKey, overlaps, toKey, type DayRange, type Period } from './dates'
import type { Employee, LeaveRequest, LeaveStatus, LeaveType } from './types'

export interface Filters {
  department: string | null
  type: LeaveType | null
  status: LeaveStatus | null
}

/** Requests in the period that match the department / type / status filters. */
export function filterRequests(
  requests: LeaveRequest[],
  range: DayRange | null,
  filters: Filters,
  opts: { ignoreDepartment?: boolean } = {},
) {
  return requests.filter(
    (r) =>
      overlaps(r, range) &&
      (opts.ignoreDepartment || !filters.department || r.department === filters.department) &&
      (!filters.type || r.type === filters.type) &&
      (!filters.status || r.status === filters.status),
  )
}

export interface Summary {
  total: number
  approved: number
  rejected: number
  pending: number
  /** Approved leave days falling inside the period. */
  approvedDays: number
  byType: Record<LeaveType, { count: number; approvedDays: number }>
}

export function summarize(requests: LeaveRequest[], range: DayRange | null): Summary {
  const s: Summary = {
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    approvedDays: 0,
    byType: Object.fromEntries(LEAVE_TYPES.map((t) => [t, { count: 0, approvedDays: 0 }])) as Summary['byType'],
  }
  for (const r of requests) {
    s.total++
    s[r.status]++
    s.byType[r.type].count++
    if (r.status === 'approved') {
      const d = daysInRange(r, range)
      s.approvedDays += d
      s.byType[r.type].approvedDays += d
    }
  }
  return s
}

/** Share of decided requests (approved + rejected) that were approved; null if none decided. */
export function approvalRate(s: Pick<Summary, 'approved' | 'rejected'>) {
  const decided = s.approved + s.rejected
  return decided === 0 ? null : s.approved / decided
}

export interface EmployeeRow extends Employee, Summary {
  lastLeave: string | null
}

export function employeeRows(employees: Employee[], requests: LeaveRequest[], range: DayRange | null): EmployeeRow[] {
  const grouped = new Map<string, LeaveRequest[]>()
  for (const r of requests) grouped.set(r.employeeId, [...(grouped.get(r.employeeId) ?? []), r])
  return employees.map((e) => {
    const list = grouped.get(e.id) ?? []
    const approved = list.filter((r) => r.status === 'approved')
    const lastLeave = approved.reduce<string | null>((m, r) => (!m || r.startDate > m ? r.startDate : m), null)
    return { ...e, ...summarize(list, range), lastLeave }
  })
}

export interface ChartBucket {
  key: string
  label: string
  /** Full label for tooltips. */
  title: string
  start: string
  end: string
  values: Record<LeaveType, number>
}

/**
 * Approved leave days per bucket, stacked by type:
 * by day for Week, by week for Month, by month for Year / All time.
 */
export function chartBuckets(requests: LeaveRequest[], period: Period, range: DayRange): ChartBucket[] {
  const s = fromKey(range.start)
  const e = fromKey(range.end)
  const empty = () => Object.fromEntries(LEAVE_TYPES.map((t) => [t, 0])) as Record<LeaveType, number>
  let buckets: ChartBucket[]

  if (period === 'week') {
    buckets = []
    for (let d = s; d <= e; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      const k = toKey(d)
      buckets.push({ key: k, label: fmt(d, 'EEE d'), title: fmt(d, 'EEEE d MMM'), start: k, end: k, values: empty() })
    }
  } else if (period === 'month') {
    buckets = eachWeekOfInterval({ start: s, end: e }, { weekStartsOn: WEEK_STARTS_ON }).map((w) => {
      const ws = w < s ? s : w
      const we0 = endOfWeek(w, { weekStartsOn: WEEK_STARTS_ON })
      const we = we0 > e ? e : we0
      return {
        key: toKey(ws),
        label: `${fmt(ws, 'd')}–${fmt(we, 'd MMM')}`,
        title: `${fmt(ws, 'd MMM')} – ${fmt(we, 'd MMM yyyy')}`,
        start: toKey(ws),
        end: toKey(we),
        values: empty(),
      }
    })
  } else {
    const multiYear = s.getFullYear() !== e.getFullYear()
    buckets = eachMonthOfInterval({ start: s, end: e }).map((m) => {
      const ms = m < s ? s : startOfMonth(m)
      const me = endOfMonth(m) > e ? e : endOfMonth(m)
      return {
        key: toKey(ms),
        label: fmt(m, multiYear ? 'MMM yy' : 'MMM'),
        title: fmt(m, 'MMMM yyyy'),
        start: toKey(ms),
        end: toKey(me),
        values: empty(),
      }
    })
  }

  for (const r of requests) {
    if (r.status !== 'approved') continue
    for (const [d, share] of dayAllocation(r)) {
      if (d < range.start || d > range.end) continue
      // buckets are sorted and contiguous — find the one containing d
      const b = buckets.find((x) => d >= x.start && d <= x.end)
      if (b) b.values[r.type] += share
    }
  }
  return buckets
}

/** Approved requests covering a given day. */
export function onLeaveOn(requests: LeaveRequest[], day: string) {
  return requests.filter((r) => r.status === 'approved' && r.startDate <= day && r.endDate >= day)
}
