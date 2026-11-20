import {

  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameYear,
  isValid,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { WEEKEND_DAYS, WEEK_STARTS_ON } from './constants'
import type { LeaveRequest } from './types'

export type Period = 'week' | 'month' | 'year' | 'all'

/** Inclusive day range, as ISO `yyyy-MM-dd` strings (string comparison == date comparison). */
export interface DayRange {
  start: string
  end: string
}

export const toKey = (d: Date) => format(d, 'yyyy-MM-dd')
export const fromKey = (k: string) => parseISO(k)
export const todayKey = () => toKey(new Date())

export function isValidKey(k: string | null | undefined): k is string {
  return !!k && /^\d{4}-\d{2}-\d{2}$/.test(k) && isValid(parseISO(k))
}

export const isWorkingDay = (d: Date) => !WEEKEND_DAYS.includes(d.getDay())

/** Working days (excluding Fri/Sat) between two ISO dates, inclusive. */
export function workingDaysBetween(start: string, end: string): number {
  if (end < start) return 0
  return eachDayOfInterval({ start: fromKey(start), end: fromKey(end) }).filter(isWorkingDay).length
}

export function periodRange(period: Period, anchor: Date): DayRange | null {
  switch (period) {
    case 'week':
      return {
        start: toKey(startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON })),
        end: toKey(endOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON })),
      }
    case 'month':
      return { start: toKey(startOfMonth(anchor)), end: toKey(endOfMonth(anchor)) }
    case 'year':
      return { start: toKey(startOfYear(anchor)), end: toKey(endOfYear(anchor)) }
    case 'all':
      return null
  }
}

export function shiftAnchor(period: Period, anchor: Date, step: number): Date {
  switch (period) {
    case 'week':
      return addWeeks(anchor, step)
    case 'month':
      return addMonths(anchor, step)
    case 'year':
      return addYears(anchor, step)
    case 'all':
      return anchor
  }
}

export function periodLabel(period: Period, anchor: Date): string {
  const now = new Date()
  switch (period) {
    case 'week': {
      const s = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON })
      return `Week of ${format(s, isSameYear(s, now) ? 'd MMM' : 'd MMM yyyy')}`
    }
    case 'month':
      return format(anchor, 'MMM yyyy')
    case 'year':
      return format(anchor, 'yyyy')
    case 'all':
      return 'All time'
  }
}

/** Does the request's date range overlap the period? `null` range = all time. */
export function overlaps(req: Pick<LeaveRequest, 'startDate' | 'endDate'>, range: DayRange | null) {
  if (!range) return true
  return req.startDate <= range.end && req.endDate >= range.start
}

/**
 * How a request's `days` are spread over calendar dates.
 * Each working day in the range gets an equal share of `days`, so that summing
 * any set of non-overlapping periods always adds back up to `days` — even when the
 * sheet's day count differs from the calculated one (half days, etc.).
 */
const allocationCache = new WeakMap<LeaveRequest, [string, number][]>()
export function dayAllocation(req: LeaveRequest): [string, number][] {
  const cached = allocationCache.get(req)
  if (cached) return cached
  let dates: string[] = []
  if (req.endDate >= req.startDate) {
    dates = eachDayOfInterval({ start: fromKey(req.startDate), end: fromKey(req.endDate) })
      .filter(isWorkingDay)
      .map(toKey)
  }
  if (dates.length === 0) dates = [req.startDate]
  const share = req.days / dates.length
  const result = dates.map((d) => [d, share] as [string, number])
  allocationCache.set(req, result)
  return result
}

/** Leave days of a request that fall inside the range (all of them for `null`). */
export function daysInRange(req: LeaveRequest, range: DayRange | null): number {
  if (!range) return req.days
  if (req.startDate >= range.start && req.endDate <= range.end) return req.days
  let total = 0
  for (const [d, share] of dayAllocation(req)) if (d >= range.start && d <= range.end) total += share
  return total
}

/** Overall date bounds of the data (used for "All time"). */
export function dataBounds(requests: LeaveRequest[]): DayRange | null {
  if (requests.length === 0) return null
  const starts = requests.map((r) => fromKey(r.startDate))
  const ends = requests.map((r) => fromKey(r.endDate))
  return { start: toKey(minDate(starts)), end: toKey(maxDate(ends)) }
}

export const formatDate = (k: string) => format(fromKey(k), 'd MMM yyyy')
export const formatShort = (k: string) => format(fromKey(k), 'd MMM')

export function formatRange(start: string, end: string) {
  if (start === end) return formatDate(start)
  const s = fromKey(start)
  const e = fromKey(end)
  if (isSameYear(s, e)) return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`
  return `${formatDate(start)} – ${formatDate(end)}`
}

/** Round to at most one decimal and drop trailing ".0". */
export function formatDays(n: number) {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

