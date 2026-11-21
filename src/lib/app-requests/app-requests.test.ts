import { describe, expect, it } from 'vitest'
import type { Employee, LeaveData } from '../types'
import { APP_ID_OFFSET, appRecordToRow, mergeAppRequests } from './to-rows'
import { daysInRange, validateNewRequest, type AppLeaveRecord } from './validate'

const base = { employee: 'Anwar', startDate: '2026-11-22', endDate: '2026-11-22', days: 1, leaveType: 'annual', reason: 'Family', status: 'approved' }

describe('validateNewRequest', () => {
  it('accepts a single day and a range', () => {
    expect(validateNewRequest(base).ok).toBe(true)
    expect(validateNewRequest({ ...base, endDate: '2026-11-26', days: 3 }).ok).toBe(true)
    expect(validateNewRequest({ ...base, days: 0.5 }).ok).toBe(true)
  })
  it('rejects bad input with specific errors', () => {
    const bad = (o: object) => {
      const r = validateNewRequest({ ...base, ...o })
      return r.ok ? [] : r.errors
    }
    expect(bad({ employee: ' ' })).toEqual(['employee'])
    expect(bad({ startDate: '22/11/2026' })).toContain('startDate')
    expect(bad({ endDate: '2026-11-20' })).toEqual(['endBeforeStart'])
    expect(bad({ days: 0 })).toEqual(['days'])
    expect(bad({ days: 1.3 })).toEqual(['days'])
    expect(bad({ endDate: '2026-11-24', days: 4 })).toEqual(['daysTooMany'])
    expect(bad({ leaveType: 'vacation' })).toEqual(['leaveType'])
    expect(bad({ status: 'pending' })).toEqual(['status'])
    expect(bad({ reason: 'x'.repeat(501) })).toEqual(['reason'])
  })
  it('counts calendar days inclusively', () => {
    expect(daysInRange('2026-11-22', '2026-11-22')).toBe(1)
    expect(daysInRange('2026-12-30', '2027-01-02')).toBe(4)
  })
})

const anwar: Employee = { id: 'anwar', name: 'Anwar', inFsrList: true, fsrAnnualUsed: 8, variants: [] }
const rec = (o: Partial<AppLeaveRecord> = {}): AppLeaveRecord =>
  ({ ...base, id: 7, createdAt: '2026-11-21T10:00:00Z', ...o }) as AppLeaveRecord

describe('appRecordToRow', () => {
  it('places the request in its sheet week (Sat → Fri) and keeps the exact dates', () => {
    // 22 Nov 2026 is a Sunday → week of Sat 21 Nov
    const r = appRecordToRow(rec(), new Map([['anwar', anwar]]))
    expect(r).toMatchObject({ id: APP_ID_OFFSET + 7, source: 'app', appId: 7, weekKey: '2026-11-21', weekLabel: '21-11 to 27-11' })
    expect(r).toMatchObject({ employee: 'Anwar', employeeId: 'anwar', inFsrList: true, categories: ['annual'], annualDays: 1, otherDays: 0 })
  })
  it('non-annual days are "other" days; rejected counts 0', () => {
    const m = new Map([['anwar', anwar]])
    expect(appRecordToRow(rec({ leaveType: 'sick', days: 3, endDate: '2026-11-24' }), m)).toMatchObject({ annualDays: 0, otherDays: 3 })
    expect(appRecordToRow(rec({ status: 'rejected', days: 1 }), m)).toMatchObject({ annualDays: 0, otherDays: 0, status: 'rejected' })
  })
})

describe('mergeAppRequests', () => {
  it('adds rows and weeks; unknown names become non-FSR people', () => {
    const data: LeaveData = {
      rows: [],
      employees: [anwar],
      issues: { unparsedWeeks: [], nonSaturdayWeeks: [], emptyNameRows: [], unmatchedNames: [], unclassified: [] },
      sheetWeeks: ['2026-11-14'],
      rawStatusCounts: {},
      rawRowCount: 0,
      app: { available: false, count: 0 },
    }
    const out = mergeAppRequests(data, [rec(), rec({ id: 8, employee: 'New Person' })])
    expect(out.rows).toHaveLength(2)
    expect(out.sheetWeeks).toEqual(['2026-11-21'])
    expect(out.app).toEqual({ available: true, count: 2 })
    expect(out.employees.find((e) => e.name === 'New Person')).toMatchObject({ inFsrList: false })
  })
})
