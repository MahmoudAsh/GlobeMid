import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
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
import { LEAVE_TYPES, STATUSES, STATUS_LABELS, WEEK_STARTS_ON } from '@/lib/constants'
import type { Period } from '@/lib/dates'

const ALL = '__all'

export function FilterBar() {
  const f = useFilters()
  const { data } = useLeaveData()
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
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="all">All time</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous period"
              disabled={f.period === 'all'}
              onClick={() => f.step(-1)}
            >
              <ChevronLeft />
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
              aria-label="Next period"
              disabled={f.period === 'all'}
              onClick={() => f.step(1)}
            >
              <ChevronRight />
            </Button>
            <Button variant="ghost" onClick={f.resetToToday} disabled={f.period === 'all' || f.isCurrent}>
              Today
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={f.department ?? ALL} onValueChange={(v) => f.setFilter('department', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={f.type ?? ALL} onValueChange={(v) => f.setFilter('type', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Leave type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>All types</SelectItem>
              {LEAVE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  <TypeSwatch type={t} /> {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={f.status ?? ALL} onValueChange={(v) => f.setFilter('status', v === ALL ? null : v)}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <StatusIcon status={s} /> {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {f.activeFilterCount > 0 && (
            <Button variant="ghost" onClick={f.clearFilters} className="text-muted-foreground">
              <X /> Clear
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
