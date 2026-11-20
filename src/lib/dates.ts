import { format, isSameYear, parseISO, type Locale } from 'date-fns'

export const toKey = (d: Date) => format(d, 'yyyy-MM-dd')
export const fromKey = (k: string) => parseISO(k)
export const todayKey = () => toKey(new Date())
export const isValidKey = (k: string | null | undefined): k is string =>
  !!k && /^\d{4}-\d{2}-\d{2}$/.test(k) && !Number.isNaN(parseISO(k).getTime())

/** Locale used for every date shown to people (set by the language switcher). */
let displayLocale: Locale | undefined
export function setDateLocale(locale: Locale | undefined) {
  displayLocale = locale
}
/** `format` for display text, in the current UI language. */
export const fmt = (d: Date, pattern: string) => format(d, pattern, { locale: displayLocale })

/** "14 – 20 Nov 2026", "27 Dec 2025 – 2 Jan 2026". */
export function formatWeek(start: Date, end: Date) {
  if (!isSameYear(start, end)) return `${fmt(start, 'd MMM yyyy')} – ${fmt(end, 'd MMM yyyy')}`
  if (start.getMonth() === end.getMonth()) return `${fmt(start, 'd')} – ${fmt(end, 'd MMM yyyy')}`
  return `${fmt(start, 'd MMM')} – ${fmt(end, 'd MMM yyyy')}`
}

/** Round to at most one decimal and drop trailing ".0". */
export function formatDays(n: number) {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}
