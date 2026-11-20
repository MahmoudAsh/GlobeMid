import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format } from 'date-fns'
import { ar as arLocale } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TypeSwatch } from '@/components/leave-type'
import { StatusIcon } from '@/components/status-badge'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { LEAVE_TYPES, STATUSES, WEEK_STARTS_ON } from '@/lib/constants'
import { useI18n } from '@/i18n/i18n-context'
import type { Period } from '@/lib/dates'

const ALL = '__all'

export function FilterBar() {
  const f = useFilters()
  const { data, hasDepartments } = useLeaveData()
  const { t, lang } = useI18n()
  const [calOpen, setCalOpen] = useState(false)
  const departments = useMemo(
    () => [...new Set(data.employees.map((e) => e.department).filter((d): d is string => !!d))].sort(),
    [data.employees],
  )

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
            <Button
              variant="outline"
              size="icon"
              aria-label={t.period.previous}
              disabled={f.period === 'all'}
              onClick={() => f.step(-1)}
            >
              <ChevronLeft className="rtl:rotate-180" />
            </Button>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-36 justify-center font-medium" disabled={f.period === 'all'}>
                  <CalendarDays className="text-muted-foreground" />
                  <span aria-live="polite">{f.label}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={f.anchor}
                  defaultMonth={f.anchor}
                  weekStartsOn={WEEK_STARTS_ON}
                  locale={lang === 'ar' ? arLocale : undefined}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  // Arabic weekday names are long; use the one-letter form in the grid header.
                  formatters={lang === 'ar' ? { formatWeekdayName: (d) => format(d, 'EEEEE', { locale: arLocale }) } : undefined}
                  onSelect={(d) => {
                    if (d) f.setAnchor(d)
                    setCalOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              aria-label={t.period.next}
              disabled={f.period === 'all'}
              onClick={() => f.step(1)}
            >
              <ChevronRight className="rtl:rotate-180" />
            </Button>
            <Button variant="ghost" onClick={f.resetToToday} disabled={f.period === 'all' || f.isCurrent}>
              {t.period.today}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {hasDepartments && (
          <Select value={f.department ?? ALL} onValueChange={(v) => f.setFilter('department', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-48" aria-label={t.filters.department}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>{t.filters.allDepartments}</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}

          <Select value={f.type ?? ALL} onValueChange={(v) => f.setFilter('type', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-36" aria-label={t.filters.type}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>{t.filters.allTypes}</SelectItem>
              {LEAVE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  <TypeSwatch type={type} /> {t.leaveType[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={f.status ?? ALL} onValueChange={(v) => f.setFilter('status', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-36" aria-label={t.filters.status}>
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
