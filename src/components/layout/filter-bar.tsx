import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryDot } from '@/components/category'
import { StatusIcon } from '@/components/status-badge'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { CATEGORIES, STATUSES } from '@/lib/categories'
import type { Period } from '@/lib/periods'
import { useLeaveData } from '@/context/data-context'
import { fmt, todayKey } from '@/lib/dates'
import { useMemo } from 'react'

const ALL = '__all'

export function FilterBar() {
  const f = useFilters()
  const { t } = useI18n()
  return (
    <Card className="gap-0 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={f.period} onValueChange={(v) => f.setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="week">{t.period.week}</TabsTrigger>
              <TabsTrigger value="month">{t.period.month}</TabsTrigger>
              <TabsTrigger value="year">{t.period.year}</TabsTrigger>
              <TabsTrigger value="all">{t.period.all}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label={t.period.previous} disabled={!f.canPrev} onClick={() => f.step(-1)}>
              <ChevronLeft className="rtl:rotate-180" />
            </Button>
            {f.period === 'month' || f.period === 'year' ? (
              <MonthYearPicker />
            ) : (
              <span aria-live="polite" className="min-w-36 rounded-lg border px-3 py-1 text-center text-sm font-medium tabular-nums">
                {f.label}
              </span>
            )}
            <Button variant="outline" size="icon" aria-label={t.period.next} disabled={!f.canNext} onClick={() => f.step(1)}>
              <ChevronRight className="rtl:rotate-180" />
            </Button>
            <Button variant="ghost" onClick={f.reset} disabled={f.isDefault}>
              {t.period.reset}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={f.category ?? ALL} onValueChange={(v) => f.setFilter('category', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-52" aria-label={t.filters.category}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>{t.filters.allCategories}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  <CategoryDot category={c} /> {t.category[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={f.status ?? ALL} onValueChange={(v) => f.setFilter('status', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-40" aria-label={t.filters.status}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>{t.filters.allStatuses}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <StatusIcon status={s} /> {t.status[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {f.activeFilterCount > 0 && (
            <Button variant="ghost" onClick={f.clearFilters} className="text-muted-foreground">
              <X /> {t.filters.clear}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

/** Month mode: month + year lists. Year mode: year list. Jumps straight to the chosen period. */
function MonthYearPicker() {
  const f = useFilters()
  const { data } = useLeaveData()
  const { t } = useI18n()
  const [y, m] = f.anchor.split('-')
  const years = useMemo(() => {
    const set = new Set(data.sheetWeeks.map((w) => w.slice(0, 4)))
    set.add(todayKey().slice(0, 4))
    set.add(y)
    return [...set].sort()
  }, [data.sheetWeeks, y])
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: fmt(new Date(2026, i, 1), 'MMMM') })), [])
  const go = (year: string, month: string) => f.setAnchor(`${year}-${month}-01`)

  return (
    <div className="flex items-center gap-1" aria-live="polite">
      {f.period === 'month' && (
        <Select value={m} onValueChange={(v) => go(y, v)}>
          <SelectTrigger className="w-32" aria-label={t.period.month}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {months.map((mo) => (
              <SelectItem key={mo.value} value={mo.value}>
                {mo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select value={y} onValueChange={(v) => go(v, m)}>
        <SelectTrigger className="w-24" aria-label={t.period.year}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {years.map((yr) => (
            <SelectItem key={yr} value={yr}>
              {yr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
