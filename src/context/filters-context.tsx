import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LEAVE_TYPES, STATUSES } from '@/lib/constants'
import {
  dataBounds,
  fromKey,
  isValidKey,
  periodLabel,
  periodRange,
  shiftAnchor,
  toKey,
  todayKey,
  type DayRange,
  type Period,
} from '@/lib/dates'
import type { Filters } from '@/lib/stats'
import type { LeaveStatus, LeaveType } from '@/lib/types'
import { useLeaveData } from './data-context'
import { useI18n } from '@/i18n/i18n-context'

const PERIODS: Period[] = ['week', 'month', 'year', 'all']
const DEFAULT_PERIOD: Period = 'month'

interface FilterState extends Filters {
  period: Period
  anchor: Date
  /** Selected period, or null for "All time". */
  range: DayRange | null
  /** Range to draw charts over (for "All time": the span of the data). */
  chartRange: DayRange | null
  label: string
  isCurrent: boolean
  /** Current query string ("?p=week&…"), to keep filters when navigating. */
  search: string
  setPeriod: (p: Period) => void
  step: (dir: -1 | 1) => void
  setAnchor: (d: Date) => void
  resetToToday: () => void
  setFilter: (key: 'department' | 'type' | 'status', value: string | null) => void
  clearFilters: () => void
  activeFilterCount: number
}

const FilterContext = createContext<FilterState | null>(null)

/** Global period + filter state, stored in the URL query so views are shareable. */
export function FilterProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const { data } = useLeaveData()
  const { t: tr } = useI18n()

  const p = params.get('p') as Period | null
  const period: Period = p && PERIODS.includes(p) ? p : DEFAULT_PERIOD
  const d = params.get('d')
  const anchorKey = isValidKey(d) ? d : todayKey()
  const t = params.get('type') as LeaveType | null
  const s = params.get('status') as LeaveStatus | null
  const department = params.get('dept')
  const type = t && LEAVE_TYPES.includes(t) ? t : null
  const status = s && STATUSES.includes(s) ? s : null

  const update = useCallback(
    (fn: (next: URLSearchParams) => void) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          fn(next)
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  const setAnchorKey = useCallback(
    (next: URLSearchParams, key: string) => (key === todayKey() ? next.delete('d') : next.set('d', key)),
    [],
  )

  const value = useMemo<FilterState>(() => {
    const anchor = fromKey(anchorKey)
    const range = periodRange(period, anchor)
    const today = todayKey()
    return {
      period,
      anchor,
      department,
      type,
      status,
      range,
      chartRange: range ?? dataBounds(data.requests),
      label: periodLabel(period, anchor, { weekOf: tr.period.weekOf, all: tr.period.all }),
      isCurrent: period === 'all' || (!!range && range.start <= today && range.end >= today),
      search: params.toString() ? `?${params.toString()}` : '',
      setPeriod: (np) => update((n) => (np === DEFAULT_PERIOD ? n.delete('p') : n.set('p', np))),
      step: (dir) => update((n) => setAnchorKey(n, toKey(shiftAnchor(period, anchor, dir)))),
      setAnchor: (date) => update((n) => setAnchorKey(n, toKey(date))),
      resetToToday: () => update((n) => n.delete('d')),
      setFilter: (key, v) => update((n) => (v ? n.set(key === 'department' ? 'dept' : key, v) : n.delete(key === 'department' ? 'dept' : key))),
      clearFilters: () =>
        update((n) => {
          n.delete('dept')
          n.delete('type')
          n.delete('status')
        }),
      activeFilterCount: [department, type, status].filter(Boolean).length,
    }
  }, [anchorKey, period, department, type, status, params, data.requests, update, setAnchorKey, tr])

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used inside <FilterProvider>')
  return ctx
}
