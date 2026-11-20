/**
 * The Week column is text like "27-12 to 2-1": day-month to day-month, with NO year.
 * Weeks run Saturday → Friday and rows are in chronological order.
 */

export interface WeekParts {
  startDay: number
  startMonth: number
  endDay: number
  endMonth: number
}

const WEEK_RE = /^\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*(?:to|-|–|—|الى|إلى)\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*$/i

export function parseWeekLabel(label: string | null | undefined): WeekParts | null {
  const m = WEEK_RE.exec(label ?? '')
  if (!m) return null
  const [startDay, startMonth, endDay, endMonth] = m.slice(1).map(Number)
  const ok = (d: number, mo: number) => mo >= 1 && mo <= 12 && d >= 1 && d <= 31
  return ok(startDay, startMonth) && ok(endDay, endMonth) ? { startDay, startMonth, endDay, endMonth } : null
}

export interface ResolvedWeek {
  start: Date
  end: Date
}

/**
 * Give each label a real date range. The first parsed row gets `baseYear`; every time the
 * start month rolls back (e.g. 12 → 1) the year goes up. If the end month is before the start
 * month, the end is in the next year. Unparseable labels → null.
 */
export function resolveWeeks(labels: (string | null | undefined)[], baseYear: number): (ResolvedWeek | null)[] {
  let year = baseYear
  let prevMonth: number | null = null
  return labels.map((label) => {
    const p = parseWeekLabel(label)
    if (!p) return null
    // A big backwards jump in month = new year (Dec → Jan). Small backwards steps are just out-of-order rows.
    if (prevMonth !== null && p.startMonth < prevMonth - 6) year++
    prevMonth = p.startMonth
    const start = new Date(year, p.startMonth - 1, p.startDay)
    const end = new Date(p.endMonth < p.startMonth ? year + 1 : year, p.endMonth - 1, p.endDay)
    return { start, end }
  })
}

export const isSaturday = (d: Date) => d.getDay() === 6
