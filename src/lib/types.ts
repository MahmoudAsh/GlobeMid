/**
 * Core domain types. Everything in the UI is built on these shapes,
 * whatever the data source is (mock data, local CSV files, or the Google Sheet).
 */

export type LeaveStatus = 'approved' | 'rejected' | 'pending'

/**
 * Request categories. The sheet's "Request" column is free text, so each row is
 * classified by `classifyRequest()` in `data-source.ts`.
 */
export type LeaveType = 'Annual' | 'Sick' | 'DayOff' | 'Shift' | 'Training' | 'Holiday' | 'Other'

export interface Employee {
  /** URL-safe id derived from the (corrected) name. */
  id: string
  name: string
  department?: string
  /** False when the person appears in requests but not in the roster (FSRs tab). */
  inRoster: boolean
}

export interface LeaveRequest {
  id: string
  /** Employee name after alias correction. */
  employee: string
  /** Name exactly as typed in the sheet (shown when it differs). */
  employeeRaw?: string
  employeeId: string
  department?: string
  type: LeaveType
  /** ISO date, `yyyy-MM-dd`, inclusive. For weekly data: the week's Saturday. */
  startDate: string
  /** ISO date, `yyyy-MM-dd`, inclusive. For weekly data: the week's Friday. */
  endDate: string
  /**
   * 'week' when the sheet only says which week (not which days).
   * Such a request belongs to the period containing its week's first day,
   * and its days are counted on that day.
   */
  precision?: 'day' | 'week'
  /** Leave days (Annual column, or the number written in a sick request). 0 when none. */
  days: number
  /** The request text (+ note). */
  reason: string
  status: LeaveStatus
  submittedAt?: string
}

export interface LeaveData {
  employees: Employee[]
  requests: LeaveRequest[]
  /** Sheet rows that couldn't be read (e.g. no week), so they can be fixed in the sheet. */
  skippedRows?: { row: number; name: string; reason: 'noWeek' | 'noName' }[]
}
