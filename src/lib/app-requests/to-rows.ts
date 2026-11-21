/**
 * Turn requests added from the dashboard into the same LeaveRow shape as sheet rows, so every page,
 * filter and total treats them identically.
 *
 * The dashboard works on SHEET WEEKS (Saturday → Friday). An app request is placed in the week of its
 * start date (like a sheet row), and keeps its exact dates for display.
 */
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { employeeId, nameKey } from '../sheet/names'
import type { Category, Employee, LeaveData, LeaveRow } from '../types'
import type { AppLeaveRecord } from './validate'

/** App row ids start here so they never clash with sheet row numbers. */
export const APP_ID_OFFSET = 10_000_000

export function appRecordToRow(r: AppLeaveRecord, employees: Map<string, Employee>): LeaveRow {
  const start = parseISO(r.startDate)
  const end = parseISO(r.endDate)
  const weekStart = startOfWeek(start, { weekStartsOn: 6 })
  const weekEnd = addDays(weekStart, 6)
  const person = employees.get(nameKey(r.employee))
  const name = person?.name ?? r.employee
  const category = r.leaveType as Category
  const rejected = r.status === 'rejected'
  const isAnnual = category === 'annual'
  return {
    id: APP_ID_OFFSET + r.id,
    source: 'app',
    appId: r.id,
    exactStart: start,
    exactEnd: end,
    rawName: r.employee,
    employee: name,
    employeeId: person?.id ?? employeeId(name),
    inFsrList: person?.inFsrList ?? false,
    weekStart,
    weekEnd,
    weekKey: format(weekStart, 'yyyy-MM-dd'),
    weekLabel: `${format(weekStart, 'd-M')} to ${format(weekEnd, 'd-M')}`,
    requestText: r.reason,
    categories: [category],
    primaryCategory: category,
    status: r.status,
    // Days the manager typed are exact; annual ones count towards the annual balance.
    annualDays: rejected || !isAnnual ? 0 : r.days,
    otherDays: rejected || isAnnual ? 0 : r.days,
    annualCell: isAnnual ? `${r.days} Day` : '',
    note: '',
  }
}

/** Add app requests to the parsed sheet data (rows, weeks, and people who only appear in the app). */
export function mergeAppRequests(data: LeaveData, records: AppLeaveRecord[]): LeaveData {
  const byKey = new Map(data.employees.map((e) => [nameKey(e.name), e]))
  const employees = [...data.employees]
  for (const r of records) {
    const key = nameKey(r.employee)
    if (byKey.has(key)) continue
    const e: Employee = { id: employeeId(r.employee), name: r.employee.trim(), inFsrList: false, fsrAnnualUsed: null, variants: [] }
    byKey.set(key, e)
    employees.push(e)
  }
  const appRows = records.map((r) => appRecordToRow(r, byKey))
  const rows = [...data.rows, ...appRows]
  return {
    ...data,
    rows,
    employees: employees.sort((a, b) => a.name.localeCompare(b.name)),
    sheetWeeks: [...new Set(rows.map((r) => r.weekKey))].sort(),
    app: { available: true, count: appRows.length },
  }
}
