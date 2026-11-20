import { CalendarCheck2, CheckCircle2, Clock, FileText, UserRoundX, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/employee-avatar'
import { DataCheck } from '@/components/data-check'
import { EmptyState } from '@/components/empty-state'
import { LeaveDaysChart } from '@/components/leave-days-chart'
import { LeaveTypeLabel } from '@/components/leave-type'
import { CardSkeleton, TilesSkeleton } from '@/components/loading'
import { PageHeader } from '@/components/page-header'
import { StatTile } from '@/components/stat-tile'
import { StatusBadge } from '@/components/status-badge'
import { TypeBreakdown } from '@/components/type-breakdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { OFF_TYPES } from '@/lib/constants'
import { formatDays, formatRange, periodRange } from '@/lib/dates'
import { chartBuckets, employeeRows, filterRequests, summarize } from '@/lib/stats'

export function OverviewPage() {
  const { data, loading } = useLeaveData()
  const f = useFilters()
  const { t } = useI18n()
  const o = t.overview

  const view = useMemo(() => {
    const filters = { department: f.department, type: f.type, status: f.status }
    const scoped = filterRequests(data.requests, f.range, filters)
    const summary = summarize(scoped, f.range)
    const buckets = f.chartRange ? chartBuckets(scoped, f.period, f.chartRange) : []

    const employees = f.department ? data.employees.filter((e) => e.department === f.department) : data.employees
    const top = employeeRows(employees, scoped, f.range)
      .filter((r) => r.approvedDays > 0)
      .sort((a, b) => b.approvedDays - a.approvedDays || a.name.localeCompare(b.name))
      .slice(0, 5)

    // "This week" is always the real current week (not the selected period), but it respects
    // the department and type filters. Only types that mean the person is away count (not shift changes).
    const noStatus = { ...filters, status: null }
    const week = periodRange('week', new Date())!
    const offThisWeek = filterRequests(data.requests, week, noStatus)
      .filter((r) => r.status !== 'rejected' && OFF_TYPES.includes(r.type))
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.employee.localeCompare(b.employee))
    const peopleOffThisWeek = new Set(offThisWeek.filter((r) => r.status === 'approved').map((r) => r.employeeId)).size

    return { summary, buckets, top, peopleOffThisWeek, offThisWeek }
  }, [data, f.range, f.chartRange, f.period, f.department, f.type, f.status])

  const s = view.summary

  return (
    <div className="space-y-6">
      <PageHeader title={o.title} description={o.subtitle(f.label)} />
      <DataCheck />

      {loading ? (
        <>
          <TilesSkeleton />
          <CardSkeleton height="h-72" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatTile label={o.totalRequests} value={s.total} icon={FileText} hint={t.common.inThisPeriod} />
            <StatTile label={o.approvedDays} value={formatDays(s.approvedDays)} icon={CalendarCheck2} hint={t.common.workingDays} />
            <StatTile
              label={o.approved}
              value={s.approved}
              icon={CheckCircle2}
              iconClassName="bg-status-approved-bg text-status-approved"
            />
            <StatTile
              label={o.rejected}
              value={s.rejected}
              icon={XCircle}
              iconClassName="bg-status-rejected-bg text-status-rejected"
            />
            <StatTile
              label={o.pending}
              value={s.pending}
              icon={Clock}
              iconClassName="bg-status-pending-bg text-status-pending"
            />
            <StatTile label={o.onLeaveToday} value={view.peopleOffThisWeek} icon={UserRoundX} hint={o.onLeaveTodayHint} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{o.chartTitle}</CardTitle>
              <CardDescription>{o.chartSubtitle(f.label, o.chartBy[f.period])}</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveDaysChart buckets={view.buckets} types={f.type ? [f.type] : undefined} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{o.byType}</CardTitle>
                <CardDescription>{o.byTypeSubtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <TypeBreakdown summary={s} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{o.top5}</CardTitle>
                <CardDescription>{f.label}</CardDescription>
              </CardHeader>
              <CardContent>
                {view.top.length === 0 ? (
                  <EmptyState className="py-6" />
                ) : (
                  <ol className="space-y-3">
                    {view.top.map((e, i) => (
                      <li key={e.id}>
                        <Link
                          to={{ pathname: `/employees/${e.id}`, search: f.search }}
                          className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-muted"
                        >
                          <span className="w-4 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                          <EmployeeAvatar name={e.name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{e.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{e.department ?? (e.inRoster ? '' : t.common.notInRoster)}</p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">{t.units.daysShort(formatDays(e.approvedDays))}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{o.whosOff}</CardTitle>
                <CardDescription>{o.whosOffSubtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                {view.offThisWeek.length === 0 ? (
                  <EmptyState className="py-6" title={o.nobodyOff} />
                ) : (
                  <ul className="space-y-3">
                    {view.offThisWeek.map((r) => (
                      <li key={r.id}>
                        <Link
                          to={{ pathname: `/employees/${r.employeeId}`, search: f.search }}
                          className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-muted"
                        >
                          <EmployeeAvatar name={r.employee} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{r.employee}</p>
                            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              <LeaveTypeLabel type={r.type} />
                              <span>{formatRange(r.startDate, r.endDate)}</span>
                            </p>
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
