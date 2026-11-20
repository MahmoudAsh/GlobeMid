import { CalendarCheck2, CheckCircle2, CircleDashed, FileText, UserRoundX, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnnualChart } from '@/components/annual-chart'
import { CategoryBadges } from '@/components/category'
import { CategoryBreakdown } from '@/components/category-breakdown'
import { EmployeeAvatar } from '@/components/employee-avatar'
import { EmptyState } from '@/components/empty-state'
import { CardSkeleton, TilesSkeleton } from '@/components/loading'
import { PageHeader } from '@/components/page-header'
import { NotInFsrTag } from '@/components/roster-tag'
import { StatTile } from '@/components/stat-tile'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { SHEET_CONFIG } from '@/lib/config'
import { formatDays, formatWeek, fromKey } from '@/lib/dates'
import { annualBuckets, employeeStats, filterRows, summarize } from '@/lib/stats'
import { addDays } from 'date-fns'

export function OverviewPage() {
  const { data, loading } = useLeaveData()
  const f = useFilters()
  const { t } = useI18n()
  const o = t.overview

  const view = useMemo(() => {
    const filters = { category: f.category, status: f.status }
    const scoped = filterRows(data.rows, f.range, filters)
    const summary = summarize(scoped)
    const buckets = annualBuckets(scoped, f.period, f.range, data.sheetWeeks)
    const top = employeeStats(data.employees, scoped, data.rows, SHEET_CONFIG.fsrCounterStart)
      .filter((e) => e.summary.annualDays > 0)
      .sort((a, b) => b.summary.annualDays - a.summary.annualDays || a.name.localeCompare(b.name))
      .slice(0, 6)
    // "This week" = the current sheet week, whatever period is selected (category/status filters still apply).
    const thisWeekRows = f.thisWeek
      ? filterRows(data.rows, { start: f.thisWeek, end: f.thisWeek }, filters).sort(
          (a, b) => a.employee.localeCompare(b.employee) || a.id - b.id,
        )
      : []
    const onLeave = new Set(thisWeekRows.filter((r) => r.status !== 'rejected').map((r) => r.employeeId)).size
    return { summary, buckets, top, thisWeekRows, onLeave }
  }, [data, f.range, f.period, f.category, f.status, f.thisWeek])

  const s = view.summary
  const weekLabel = f.thisWeek ? formatWeek(fromKey(f.thisWeek), addDays(fromKey(f.thisWeek), 6)) : '—'

  return (
    <div className="space-y-6">
      <PageHeader title={o.title} description={o.subtitle(f.label)} />
      {loading ? (
        <>
          <TilesSkeleton />
          <CardSkeleton height="h-72" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatTile label={o.requests} value={s.rows} icon={FileText} hint={t.units.people(s.people)} />
            <StatTile label={o.annualDays} value={formatDays(s.annualDays)} icon={CalendarCheck2} hint={t.common.annualColumn} />
            <StatTile label={o.approved} value={s.approved} icon={CheckCircle2} iconClassName="bg-status-approved-bg text-status-approved" />
            <StatTile label={o.rejected} value={s.rejected} icon={XCircle} iconClassName="bg-status-rejected-bg text-status-rejected" />
            <StatTile label={o.notMarked} value={s.notMarked} icon={CircleDashed} iconClassName="bg-muted text-muted-foreground" hint={o.notMarkedHint} />
            <StatTile label={o.onLeaveThisWeek} value={view.onLeave} icon={UserRoundX} hint={o.onLeaveThisWeekHint(weekLabel)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{o.chartTitle}</CardTitle>
              <CardDescription>{o.chartSubtitle(f.label, o.chartBy[f.period])}</CardDescription>
            </CardHeader>
            <CardContent>
              <AnnualChart buckets={view.buckets} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{o.byCategory}</CardTitle>
                <CardDescription>{o.byCategorySubtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdown summary={s} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{o.topAnnual}</CardTitle>
                <CardDescription>{f.label}</CardDescription>
              </CardHeader>
              <CardContent>
                {view.top.length === 0 ? (
                  <EmptyState className="py-6" />
                ) : (
                  <ol className="space-y-3">
                    {view.top.map((e, i) => (
                      <li key={e.id}>
                        <Link to={{ pathname: `/employees/${e.id}`, search: f.search }} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-muted">
                          <span className="w-4 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                          <EmployeeAvatar name={e.name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{e.name}</p>
                            {!e.inFsrList && <NotInFsrTag />}
                          </div>
                          <span className="text-sm font-semibold tabular-nums">{t.units.daysShort(formatDays(e.summary.annualDays))}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{o.thisWeek}</CardTitle>
                <CardDescription>{o.thisWeekSubtitle(weekLabel)}</CardDescription>
              </CardHeader>
              <CardContent>
                {view.thisWeekRows.length === 0 ? (
                  <EmptyState className="py-6" title={o.nothingThisWeek} />
                ) : (
                  <ul className="max-h-[28rem] space-y-3 overflow-y-auto pe-1">
                    {view.thisWeekRows.map((r) => (
                      <li key={r.id}>
                        <Link to={{ pathname: `/employees/${r.employeeId}`, search: f.search }} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-1 hover:bg-muted">
                          <EmployeeAvatar name={r.employee} />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate text-sm font-medium">{r.employee}</p>
                            <p dir="auto" className="text-xs text-muted-foreground">{r.requestText}</p>
                            <CategoryBadges categories={r.categories} />
                          </div>
                          <StatusBadge status={r.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
