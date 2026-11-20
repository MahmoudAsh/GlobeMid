/**
 * Periods work on SHEET WEEKS: a row belongs to a month / year by its week's start (Saturday).
 * Week mode steps through the weeks that actually exist in the sheet.
 */
import { addDays, addMonths, addYears, endOfMonth, endOfYear, startOfMonth, startOfYear } from 'date-fns'
import { fmt, formatWeek, fromKey, toKey } from './dates'

export type Period = 'week' | 'month' | 'year' | 'all'
export const PERIODS: Period[] = ['week', 'month', 'year', 'all']

/** Inclusive range of week-start keys; null = all time. */
export interface WeekRange {
  start: string
  end: string
}

/** The sheet week that contains `key` (or the closest earlier one; the first week if none). */
export function snapToSheetWeek(key: string, sheetWeeks: string[]): string {
  let best = sheetWeeks[0] ?? key
  for (const w of sheetWeeks) if (w <= key) best = w
  return best
}

export function periodRange(period: Period, anchor: string, sheetWeeks: string[]): WeekRange | null {
  const d = fromKey(anchor)
  switch (period) {
    case 'week': {
      const w = snapToSheetWeek(anchor, sheetWeeks)
      return { start: w, end: w }
    }
    case 'month':
      return { start: toKey(startOfMonth(d)), end: toKey(endOfMonth(d)) }
    case 'year':
      return { start: toKey(startOfYear(d)), end: toKey(endOfYear(d)) }
    case 'all':
      return null
  }
}

export const inRange = (weekKey: string, range: WeekRange | null) => !range || (weekKey >= range.start && weekKey <= range.end)

/** Previous / next period. Week mode moves to the neighbouring sheet week. */
export function stepAnchor(period: Period, anchor: string, dir: -1 | 1, sheetWeeks: string[]): string {
  const d = fromKey(anchor)
  switch (period) {
    case 'week': {
      const i = sheetWeeks.indexOf(snapToSheetWeek(anchor, sheetWeeks))
      return sheetWeeks[Math.min(sheetWeeks.length - 1, Math.max(0, i + dir))] ?? anchor
    }
    case 'month':
      return toKey(addMonths(d, dir))
    case 'year':
      return toKey(addYears(d, dir))
    case 'all':
      return anchor
  }
}

export function canStep(period: Period, anchor: string, dir: -1 | 1, sheetWeeks: string[]) {
  if (period === 'all' || sheetWeeks.length === 0) return false
  if (period === 'week') {
    const i = sheetWeeks.indexOf(snapToSheetWeek(anchor, sheetWeeks))
    return dir < 0 ? i > 0 : i < sheetWeeks.length - 1
  }
  const r = periodRange(period, stepAnchor(period, anchor, dir, sheetWeeks), sheetWeeks)!
  return sheetWeeks.some((w) => inRange(w, r))
}

export function periodLabel(period: Period, anchor: string, sheetWeeks: string[], allLabel: string) {
  const d = fromKey(anchor)
  switch (period) {
    case 'week': {
      const w = fromKey(snapToSheetWeek(anchor, sheetWeeks))
      return formatWeek(w, addDays(w, 6))
    }
    case 'month':
      return fmt(d, 'MMM yyyy')
    case 'year':
      return fmt(d, 'yyyy')
    case 'all':
      return allLabel
  }
}

/** The current sheet week: the one containing today, else the latest one before today. */
export function currentSheetWeek(sheetWeeks: string[], today: string): string | null {
  const w = sheetWeeks.filter((k) => k <= today).at(-1)
  return w ?? null
}
