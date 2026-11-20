import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '@/i18n/i18n-context'
import { CATEGORIES, STATUSES } from '@/lib/categories'
import { isValidKey, todayKey } from '@/lib/dates'
import {
  canStep,
  currentSheetWeek,
  periodLabel,
  periodRange,
  PERIODS,
  snapToSheetWeek,
  stepAnchor,
  type Period,
  type WeekRange,
} from '@/lib/periods'
import type { RowFilters } from '@/lib/stats'
import type { Category, RowStatus } from '@/lib/types'
import { useLeaveData } from './data-context'

/** Default view: the whole year of the latest sheet week (e.g. "2026"). */
const DEFAULT_PERIOD: Period = 'year'

interface FilterState extends RowFilters {
  period: Period
  /** `yyyy-MM-dd` the period is built around (a sheet week start in week mode). */
  anchor: string
  range: WeekRange | null
  label: string
  /** The sheet week containing today (or the latest before it) — for "this week" widgets. */
  thisWeek: string | null
  canPrev: boolean
  canNext: boolean
  isDefault: boolean
  /** Current query string ("?p=week&…"), to keep filters when navigating. */
  search: string
  setPeriod: (p: Period) => void
  step: (dir: -1 | 1) => void
  setAnchor: (key: string) => void
  reset: () => void
  setFilter: (key: 'category' | 'status', value: string | null) => void
  clearFilters: () => void
  activeFilterCount: number
}

const FilterContext = createContext<FilterState | null>(null)

/** Global period + filter state, stored in the URL query so every view is shareable. */
export function FilterProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const { data } = useLeaveData()
  const { t: tr } = useI18n()
  const weeks = data.sheetWeeks

  const p = params.get('p') as Period | null
  const period: Period = p && PERIODS.includes(p) ? p : DEFAULT_PERIOD
  const latest = weeks.at(-1) ?? todayKey()
  const d = params.get('d')
  const rawAnchor = isValidKey(d) ? d : latest
  const anchor = period === 'week' ? snapToSheetWeek(rawAnchor, weeks) : rawAnchor
  const c = params.get('cat') as Category | null
  const s = params.get('status') as RowStatus | null
  const category = c && CATEGORIES.includes(c) ? c : null
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

  const value = useMemo<FilterState>(() => {
    const setAnchorIn = (n: URLSearchParams, key: string) => (key === latest ? n.delete('d') : n.set('d', key))
    return {
      period,
      anchor,
      category,
      status,
      range: periodRange(period, anchor, weeks),
      label: periodLabel(period, anchor, weeks, tr.period.all),
      thisWeek: currentSheetWeek(weeks, todayKey()),
      canPrev: canStep(period, anchor, -1, weeks),
      canNext: canStep(period, anchor, 1, weeks),
      isDefault: period === DEFAULT_PERIOD && !d,
      search: params.toString() ? `?${params.toString()}` : '',
      setPeriod: (np) =>
        update((n) => {
          if (np === DEFAULT_PERIOD) n.delete('p')
          else n.set('p', np)
          if (np === 'week') setAnchorIn(n, snapToSheetWeek(anchor, weeks))
        }),
      step: (dir) => update((n) => setAnchorIn(n, stepAnchor(period, anchor, dir, weeks))),
      setAnchor: (key) => update((n) => setAnchorIn(n, period === 'week' ? snapToSheetWeek(key, weeks) : key)),
      reset: () =>
        update((n) => {
          n.delete('p')
          n.delete('d')
        }),
      setFilter: (key, v) => update((n) => (v ? n.set(key === 'category' ? 'cat' : key, v) : n.delete(key === 'category' ? 'cat' : key))),
      clearFilters: () =>
        update((n) => {
          n.delete('cat')
          n.delete('status')
        }),
      activeFilterCount: [category, status].filter(Boolean).length,
    }
  }, [period, anchor, category, status, weeks, latest, d, params, update, tr])

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used inside <FilterProvider>')
  return ctx
}
