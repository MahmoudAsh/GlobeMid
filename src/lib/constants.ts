import type { LeaveStatus, LeaveType } from './types'

export const LEAVE_TYPES: LeaveType[] = ['Annual', 'Sick', 'DayOff', 'Shift', 'Training', 'Holiday', 'Other']

/** Types that mean the person is away (used for "Who's off this week"). Shift changes don't count. */
export const OFF_TYPES: LeaveType[] = ['Annual', 'Sick', 'DayOff', 'Training', 'Holiday']

/**
 * Fixed colour per type, used identically in badges, charts and breakdowns.
 * The first seven slots of a validated categorical palette (colour-blind safe as an
 * adjacent/stacked set); dark-mode steps are tuned for the dark surface. Don't shuffle.
 */
export const LEAVE_TYPE_COLORS: Record<LeaveType, { light: string; dark: string }> = {
  Annual: { light: '#2a78d6', dark: '#3987e5' },
  Sick: { light: '#eb6834', dark: '#d95926' },
  DayOff: { light: '#1baf7a', dark: '#199e70' },
  Shift: { light: '#eda100', dark: '#c98500' },
  Training: { light: '#e87ba4', dark: '#d55181' },
  Holiday: { light: '#008300', dark: '#0ca30c' },
  Other: { light: '#6250d6', dark: '#9085e9' },
}

export const STATUSES: LeaveStatus[] = ['approved', 'rejected', 'pending']

/** Egypt weekend: Friday (5) and Saturday (6). */
export const WEEKEND_DAYS = [5, 6]

/** Weeks run Saturday → Friday, matching the "Week" column of the sheet (e.g. "27-12 to 2-1"). */
export const WEEK_STARTS_ON = 6 as const
