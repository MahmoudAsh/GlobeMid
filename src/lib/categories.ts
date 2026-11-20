import type { Category, RowStatus } from './types'

/** Display order. */
export const CATEGORIES: Category[] = [
  'annual',
  'sick',
  'publicHoliday',
  'birthday',
  'dayOff',
  'cancelledOff',
  'shift',
  'training',
  'emergency',
  'bereavement',
  'wedding',
  'outOfSchedule',
  'noShow',
  'leaving',
  'other',
]

export const STATUSES: RowStatus[] = ['approved', 'rejected', 'not_marked']

/**
 * Fixed colour per category. The seven common ones use a validated colour-blind-safe palette;
 * the rare ones share a neutral grey (identity is always carried by the text label too).
 */
const NEUTRAL = { light: '#8a8f98', dark: '#9aa0a8' }
export const CATEGORY_COLORS: Record<Category, { light: string; dark: string }> = {
  annual: { light: '#2a78d6', dark: '#3987e5' },
  sick: { light: '#eb6834', dark: '#d95926' },
  dayOff: { light: '#1baf7a', dark: '#199e70' },
  shift: { light: '#eda100', dark: '#c98500' },
  birthday: { light: '#e87ba4', dark: '#d55181' },
  publicHoliday: { light: '#008300', dark: '#0ca30c' },
  training: { light: '#6250d6', dark: '#9085e9' },
  cancelledOff: NEUTRAL,
  emergency: NEUTRAL,
  bereavement: NEUTRAL,
  wedding: NEUTRAL,
  outOfSchedule: NEUTRAL,
  noShow: NEUTRAL,
  leaving: NEUTRAL,
  other: NEUTRAL,
}
