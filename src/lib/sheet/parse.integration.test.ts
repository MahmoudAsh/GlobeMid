/** Integration: the real bundled export must produce the numbers we verified against the sheet. */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import aliases from '@/data/name-aliases.json'
import { parseWeeklyRequests } from './parse'

const dir = path.resolve(import.meta.dirname, '../../data')
const requestsCsv = readFileSync(path.join(dir, 'weekly-requests.csv'), 'utf8')
const fsrCsv = readFileSync(path.join(dir, 'fsrs.csv'), 'utf8')
const data = parseWeeklyRequests(requestsCsv, fsrCsv, { baseYear: 2025, aliases })
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

describe('weekly-requests.csv', () => {
  it('has 674 data lines and the expected raw statuses', () => {
    expect(data.rawRowCount).toBe(674)
    expect(data.rawStatusCounts).toEqual({ Approved: 492, '(empty)': 156, Sick: 21, Rejected: 4, Training: 1 })
  })

  it('maps statuses: 492 + 21 sick + 1 training approved, 4 rejected, rest not marked', () => {
    // 674 lines − 1 empty-name placeholder − 1 row with no readable week = 672 rows
    expect(data.issues.emptyNameRows.map((r) => r.week)).toEqual(['8-3 to 14-3'])
    expect(data.issues.unparsedWeeks.map((r) => r.row)).toEqual([655])
    expect(data.rows).toHaveLength(672)
    const by = (s: string) => data.rows.filter((r) => r.status === s).length
    expect(by('approved')).toBe(492 + 21 + 1)
    expect(by('rejected')).toBe(4)
    // 156 empty statuses − the placeholder − row 655 (also empty) = 154
    expect(by('not_marked')).toBe(154)
    expect(data.rows.filter((r) => r.categories.includes('sick') && r.status === 'approved').length).toBeGreaterThanOrEqual(21)
  })

  it('Anwar = 8 rows and 8 annual days (2+2+1+2+1)', () => {
    const anwar = data.rows.filter((r) => r.employee === 'Anwar')
    expect(anwar).toHaveLength(8)
    expect(sum(anwar.map((r) => r.annualDays))).toBe(8)
    expect(anwar.filter((r) => r.annualDays > 0).map((r) => r.annualDays)).toEqual([2, 2, 1, 2, 1])
  })

  it('FSR "Annual Used" (counted from 28 Mar 2026) matches for the people checked by hand', () => {
    const since = '2026-03-28'
    for (const name of ['Abdullah Samy', 'Fady Adel', 'Khaled', 'Wagdy', 'Mariam']) {
      const fsr = data.employees.find((e) => e.name === name)!.fsrAnnualUsed
      const computed = sum(data.rows.filter((r) => r.employee === name && r.weekKey >= since).map((r) => r.annualDays))
      expect({ name, computed }).toEqual({ name, computed: fsr })
    }
  })

  it('every week starts on a Saturday and runs to 14-20 Nov 2026', () => {
    expect(data.issues.nonSaturdayWeeks).toEqual([])
    expect(data.sheetWeeks[0]).toBe('2025-12-27')
    expect(data.sheetWeeks.at(-1)).toBe('2026-11-14')
  })

  it('lists all 57 FSRs (even without rows) plus other staff', () => {
    expect(data.employees.filter((e) => e.inFsrList)).toHaveLength(57)
    expect(data.employees.find((e) => e.name === 'Mahmoud Helal')!.variants.map((v) => v.raw)).toContain('Helal')
  })

  it('reports unmatched names, but not canonical names chosen in the alias file', () => {
    const names = data.issues.unmatchedNames.map((u) => u.name)
    expect(names).toContain('Moustafa Eid')
    for (const n of ['Yara', 'Asmaa Zidan', 'Mostafa Salem', 'Abdelrahman Gharib', 'Helal']) expect(names).not.toContain(n)
  })

  it('rejected rows count 0 days', () => {
    expect(data.rows.filter((r) => r.status === 'rejected').every((r) => r.annualDays === 0 && r.otherDays === 0)).toBe(true)
  })
})
