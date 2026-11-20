import type { LeaveStatus, LeaveType } from './types'

export const LEAVE_TYPES: LeaveType[] = ['Annual', 'Sick', 'Casual', 'Unpaid', 'Other']

/**
 * Fixed colour per leave type, used identically in badges, charts and breakdowns.
 * Validated categorical palette (colour-blind safe as an adjacent/stacked set);
 * dark-mode steps are tuned for the dark surface. Order matters — don't shuffle.
 */
export const LEAVE_TYPE_COLORS: Record<LeaveType, { light: string; dark: string }> = {
  Annual: { light: '#2a78d6', dark: '#3987e5' },
  Sick: { light: '#eb6834', dark: '#d95926' },
  Casual: { light: '#1baf7a', dark: '#199e70' },
  Unpaid: { light: '#eda100', dark: '#c98500' },
  Other: { light: '#e87ba4', dark: '#d55181' },
}

export const STATUSES: LeaveStatus[] = ['approved', 'rejected', 'pending']

/** Egypt weekend: Friday (5) and Saturday (6). */
export const WEEKEND_DAYS = [5, 6]

/** Weeks run Sunday → Saturday so the Sun–Thu work week stays together. */
export const WEEK_STARTS_ON = 0 as const

/** Map free-text leave types from the sheet onto the known set. */
export function normalizeLeaveType(raw: string): LeaveType {
  const t = raw.trim().toLowerCase()
  if (t.startsWith('annual') || t === 'vacation' || t === 'regular') return 'Annual'
  if (t.startsWith('sick') || t === 'medical') return 'Sick'
  if (t.startsWith('casual') || t === 'emergency') return 'Casual'
  if (t.startsWith('unpaid')) return 'Unpaid'
  return 'Other'
}
