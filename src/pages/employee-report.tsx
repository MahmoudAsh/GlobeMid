import { ArrowLeft, CalendarCheck2, CheckCircle2, CircleDashed, FileText, Scale, UserX, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CategoryBadges } from '@/components/category'
import { CategoryBreakdown } from '@/components/category-breakdown'
import { EmployeeAvatar } from '@/components/employee-avatar'
import { EmptyState } from '@/components/empty-state'
import { CardSkeleton, TilesSkeleton } from '@/components/loading'
import { RequestText, RowRef } from '@/components/requests-table'
import { useLeaveActions } from '@/context/leave-actions'
import { CalendarPlus } from 'lucide-react'
import { Approx, NotInFsrTag } from '@/components/roster-tag'
import { StatTile } from '@/components/stat-tile'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { SHEET_CONFIG } from '@/lib/config'
import { formatDays, formatRangeExact, formatWeek } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { employeeStats, filterRows } from '@/lib/stats'
import type { LeaveRow } from '@/lib/types'

export function EmployeeReportPage() {
  const { id = '' } = useParams()
  const { loading, data, employeesById } = useLeaveData()
  const f = useFilters()
  const { t } = useI18n()
  const rp = t.report
  const employee = employeesById.get(id)
  const { openAdd } = useLeaveActions()

  const view = useMemo(() => {
    if (!employee) return null
    const scoped = filterRows(data.rows, f.range, { category: f.category, status: f.status }).filter((r) => r.employeeId === id)
    const [stats] = employeeStats([employee], scoped, data.rows, SHEET_CONFIG.fsrCounterStart)
    // Group by week, newest first; rows inside a week in sheet order.
    const weeks = new Map<string, LeaveRow[]>()
    for (const r of [...scoped].sort((a, b) => b.weekKey.localeCompare(a.weekKey) || a.id - b.id)) {
      weeks.set(r.weekKey, [...(weeks.get(r.weekKey) ?? []), r])
    }
    return { stats, weeks: [...weeks.values()], everRows: data.rows.some((r) => r.employeeId === id) }
  }, [data.rows, employee, id, f.range, f.category, f.status])

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ms-2 text-muted-foreground">
      <Link to={{ pathname: '/employees', search: f.search }}>
        <ArrowLeft className="rtl:rotate-180" /> {rp.back}
      </Link>
    </Button>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {back}
        <TilesSkeleton count={6} />
        <CardSkeleton />
      </div>
    )
  }
  if (!employee || !view) {
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <EmptyState icon={UserX} title={rp.notFound} description={rp.notFoundHint} />
        </Card>
      </div>
    )
  }

  const { stats } = view
  const s = stats.summary
  const since = formatDate(SHEET_CONFIG.fsrCounterStart)

  return (
    <div className="space-y-6">
      {back}
      <div className="flex flex-wrap items-center gap-4">
        <EmployeeAvatar name={employee.name} className="size-14 text-base" />
        <div className="me-auto">
          <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{f.label}</span>
            {!employee.inFsrList && <NotInFsrTag />}
          </p>
        </div>
        <Button variant="outline" onClick={() => openAdd(employee.name)}>
          <CalendarPlus /> {t.form.open}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label={rp.requests} value={s.rows} icon={FileText} hint={t.common.inThisPeriod} />
        <StatTile label={rp.annualDays} value={formatDays(s.annualDays)} icon={CalendarCheck2} hint={t.common.annualColumn} />
        <StatTile label={t.status.approved} value={s.approved} icon={CheckCircle2} iconClassName="bg-status-approved-bg text-status-approved" />
        <StatTile label={t.status.rejected} value={s.rejected} icon={XCircle} iconClassName="bg-status-rejected-bg text-status-rejected" />
        <StatTile label={t.status.not_marked} value={s.notMarked} icon={CircleDashed} iconClassName="bg-muted text-muted-foreground" />
        <StatTile
          label={rp.fsrVsComputed}
          value={
            employee.inFsrList ? (
              <span className={stats.fsrMismatch ? 'text-status-pending' : undefined}>
                {stats.fsrAnnualUsed ?? '—'} / {formatDays(stats.computedAnnualUsed)}
                {stats.fsrMismatch && ' ⚠'}
              </span>
            ) : (
              '—'
            )
          }
          icon={Scale}
          hint={rp.fsrVsComputedHint(since)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{rp.byCategory}</CardTitle>
            <CardDescription>{t.overview.byCategorySubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown summary={s} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{rp.variants}</CardTitle>
            <CardDescription>{rp.variantsHint}</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {employee.variants.map((v) => (
                  <li key={v.raw} className="flex justify-between gap-3">
                    <span className="font-mono text-[13px]">“{v.raw}”</span>
                    <span className="text-muted-foreground tabular-nums">{t.units.rows(v.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rp.weeks}</CardTitle>
          <CardDescription>
            {t.common.newestFirst} · {f.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view.weeks.length === 0 ? (
            <EmptyState description={view.everRows ? t.common.tryAnother : rp.noRows(employee.name)} />
          ) : (
            <ol className="space-y-4">
              {view.weeks.map((rows) => (
                <li key={rows[0].weekKey} className="rounded-xl border">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/40 px-4 py-2">
                    <span className="font-medium">{formatWeek(rows[0].weekStart, rows[0].weekEnd)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{rows[0].weekLabel}</span>
                  </div>
                  <ul className="divide-y">
                    {rows.map((r) => (
                      <li key={r.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-start">
                        <div className="space-y-1.5">
                          {r.exactStart && r.exactEnd && (
                            <p className="text-xs font-medium text-muted-foreground">
                              {t.form.exactDates}: {formatRangeExact(r.exactStart, r.exactEnd)}
                            </p>
                          )}
                          <RequestText row={r} />
                          <CategoryBadges categories={r.categories} />
                          {r.rawName !== r.employee && <p className="text-xs text-muted-foreground">{t.common.writtenAs(r.rawName)}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm sm:justify-end">
                          {r.annualDays > 0 && (
                            <span className="font-medium tabular-nums">
                              {t.category.annual}: {formatDays(r.annualDays)}
                            </span>
                          )}
                          {r.otherDays > 0 && r.categories.some((c) => c !== 'annual') && (
                            <span className="text-muted-foreground tabular-nums">
                              <Approx /> {t.units.days(formatDays(r.otherDays), r.otherDays)}
                            </span>
                          )}
                          <StatusBadge status={r.status} />
                          <span className="font-mono text-xs text-muted-foreground">
                            {r.source === 'app' ? <RowRef row={r} /> : t.common.row(r.id)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
