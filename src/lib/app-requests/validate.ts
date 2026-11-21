/**
 * Leave requests added from the dashboard (stored in Cloudflare D1).
 * This file has NO imports on purpose: it is shared by the browser and the Cloudflare Pages Function.
 */

/** Leave types the manager can pick. They map 1:1 to dashboard categories. */
export const APP_LEAVE_TYPES = [
  'annual',
  'sick',
  'emergency',
  'publicHoliday',
  'birthday',
  'bereavement',
  'wedding',
  'training',
  'dayOff',
  'other',
] as const
export type AppLeaveType = (typeof APP_LEAVE_TYPES)[number]

export const APP_STATUSES = ['approved', 'rejected'] as const
export type AppStatus = (typeof APP_STATUSES)[number]

/** What the form sends. */
export interface NewLeaveRequest {
  employee: string
  /** yyyy-MM-dd */
  startDate: string
  /** yyyy-MM-dd (same as startDate for a single day) */
  endDate: string
  days: number
  leaveType: AppLeaveType
  reason: string
  status: AppStatus
}

/** What the API returns. */
export interface AppLeaveRecord extends NewLeaveRequest {
  id: number
  /** ISO timestamp */
  createdAt: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const isDate = (s: unknown): s is string => typeof s === 'string' && DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
/** Calendar days from start to end, inclusive. */
export const daysInRange = (start: string, end: string) =>
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1

export type ValidationError =
  | 'employee'
  | 'startDate'
  | 'endDate'
  | 'endBeforeStart'
  | 'days'
  | 'daysTooMany'
  | 'leaveType'
  | 'status'
  | 'reason'

/** Returns the clean request, or the list of problems. Used by the form AND re-checked by the server. */
export function validateNewRequest(input: unknown): { ok: true; value: NewLeaveRequest } | { ok: false; errors: ValidationError[] } {
  const o = (input ?? {}) as Record<string, unknown>
  const errors: ValidationError[] = []
  const employee = typeof o.employee === 'string' ? o.employee.replace(/\s+/g, ' ').trim() : ''
  if (!employee || employee.length > 120) errors.push('employee')
  const startDate = o.startDate
  const endDate = o.endDate ?? o.startDate
  if (!isDate(startDate)) errors.push('startDate')
  if (!isDate(endDate)) errors.push('endDate')
  if (isDate(startDate) && isDate(endDate) && endDate < startDate) errors.push('endBeforeStart')
  const days = typeof o.days === 'number' ? o.days : Number(o.days)
  if (!Number.isFinite(days) || days <= 0 || Math.round(days * 2) !== days * 2) errors.push('days') // whole or half days
  else if (isDate(startDate) && isDate(endDate) && endDate >= startDate && days > daysInRange(startDate, endDate)) errors.push('daysTooMany')
  const leaveType = o.leaveType
  if (typeof leaveType !== 'string' || !(APP_LEAVE_TYPES as readonly string[]).includes(leaveType)) errors.push('leaveType')
  const status = o.status
  if (typeof status !== 'string' || !(APP_STATUSES as readonly string[]).includes(status)) errors.push('status')
  const reason = typeof o.reason === 'string' ? o.reason.trim() : ''
  if (reason.length > 500) errors.push('reason')
  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      employee,
      startDate: startDate as string,
      endDate: endDate as string,
      days,
      leaveType: leaveType as AppLeaveType,
      reason,
      status: status as AppStatus,
    },
  }
}
