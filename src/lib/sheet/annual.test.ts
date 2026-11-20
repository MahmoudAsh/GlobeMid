import { describe, expect, it } from 'vitest'
import { parseAnnualCell } from './annual'

describe('parseAnnualCell', () => {
  it.each([
    ['1 Day', 1],
    ['2 Day', 2],
    ['3  Day', 3],
    ['5 Day ', 5],
    ['1 Day ( عيد ميلاد )', 1],
    ['1 Day ( اجازه رسميه )', 1],
    ['', 0],
    ['OFF', 0],
    ['EID', 0],
  ])('annual days of %j = %i', (cell, days) => {
    const r = parseAnnualCell(cell)
    expect(r.annualDays).toBe(days)
    expect(r.isSick).toBe(false)
  })

  it.each([
    ['1 Sick ', 1],
    ['5 Day Sick', 5],
    ['2 SiCK', 2],
    ['Sick', null],
  ])('%j is sick days (%s), never annual', (cell, sick) => {
    const r = parseAnnualCell(cell)
    expect(r.annualDays).toBe(0)
    expect(r.isSick).toBe(true)
    expect(r.sickDays).toBe(sick)
  })
})
