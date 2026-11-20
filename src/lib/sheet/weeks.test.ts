import { describe, expect, it } from 'vitest'
import { isSaturday, parseWeekLabel, resolveWeeks } from './weeks'

const ymd = (d: Date | undefined) =>
  d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

describe('parseWeekLabel', () => {
  it('reads day-month to day-month', () => {
    expect(parseWeekLabel('27-12 to 2-1')).toEqual({ startDay: 27, startMonth: 12, endDay: 2, endMonth: 1 })
    expect(parseWeekLabel(' 14-11 to 20-11 ')).toEqual({ startDay: 14, startMonth: 11, endDay: 20, endMonth: 11 })
  })
  it('rejects junk', () => {
    expect(parseWeekLabel('')).toBeNull()
    expect(parseWeekLabel('next week')).toBeNull()
    expect(parseWeekLabel('40-13 to 2-1')).toBeNull()
  })
})

describe('resolveWeeks', () => {
  it('starts at the base year and rolls the year over at Dec → Jan', () => {
    const [w1, w2, w3, w4] = resolveWeeks(['27-12 to 2-1', '3-1 to 9-1', '28-3 to 3-4', '31-10 to 6-11'], 2025)
    expect([ymd(w1?.start), ymd(w1?.end)]).toEqual(['2025-12-27', '2026-01-02'])
    expect(ymd(w2?.start)).toBe('2026-01-03')
    expect([ymd(w3?.start), ymd(w3?.end)]).toEqual(['2026-03-28', '2026-04-03'])
    expect([ymd(w4?.start), ymd(w4?.end)]).toEqual(['2026-10-31', '2026-11-06'])
  })
  it('end month before start month → end in the next year', () => {
    const [w] = resolveWeeks(['27-12 to 2-1'], 2030)
    expect([ymd(w?.start), ymd(w?.end)]).toEqual(['2030-12-27', '2031-01-02'])
  })
  it('keeps going into the following year', () => {
    const r = resolveWeeks(['27-12 to 2-1', '3-1 to 9-1', '5-12 to 11-12', '26-12 to 1-1', '2-1 to 8-1'], 2025)
    expect(r.map((w) => ymd(w?.start))).toEqual(['2025-12-27', '2026-01-03', '2026-12-05', '2026-12-26', '2027-01-02'])
  })
  it('returns null for unreadable labels without breaking the chronology', () => {
    const r = resolveWeeks(['27-12 to 2-1', '', '3-1 to 9-1'], 2025)
    expect(r[1]).toBeNull()
    expect(ymd(r[2]?.start)).toBe('2026-01-03')
  })
  it('sheet weeks start on Saturday', () => {
    const r = resolveWeeks(['27-12 to 2-1', '28-3 to 3-4', '31-10 to 6-11', '14-11 to 20-11'], 2025)
    expect(r.every((w) => w && isSaturday(w.start))).toBe(true)
  })
})
