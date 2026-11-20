/**
 * Core domain types. Everything in the UI is built on these two shapes,
 * whatever the data source is (mock data today, the Google Sheet later).
 */

export type LeaveStatus = 'approved' | 'rejected' | 'pending'

/** Known leave types get a fixed colour; anything else from the sheet is shown as "Other". */
export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Unpaid' | 'Other'

export interface Employee {
  /** URL-safe id derived from the name (see `employeeId`). */
  id: string
  name: string
  department?: string
}

export interface LeaveRequest {
  id: string
  /** Employee name, exactly as written in the sheet. */
  employee: string
  /** Id of the matching `Employee` (derived from the name). */
  employeeId: string
  department?: string
  type: LeaveType
  /** ISO date, `yyyy-MM-dd`, inclusive. */
  startDate: string
  /** ISO date, `yyyy-MM-dd`, inclusive. */
  endDate: string
  /** Working days requested (from the sheet, or calculated excluding Fri/Sat). */
  days: number
  reason: string
  status: LeaveStatus
  /** ISO date the request was submitted, if known. */
  submittedAt?: string
}

export interface LeaveData {
  employees: Employee[]
  requests: LeaveRequest[]
}
