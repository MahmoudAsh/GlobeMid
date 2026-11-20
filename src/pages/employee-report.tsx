import { ArrowLeft, CalendarCheck2, Clock, FileText, Percent, UserX, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/employee-avatar'
import { EmptyState } from '@/components/empty-state'
import { LeaveDaysChart } from '@/components/leave-days-chart'
import { CardSkeleton, TilesSkeleton } from '@/components/loading'
import { RequestsTable } from '@/components/requests-table'
import { StatTile } from '@/components/stat-tile'
import { TypeBreakdown } from '@/components/type-breakdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { formatDays } from '@/lib/dates'
import { approvalRate, chartBuckets, filterRequests, summarize } from '@/lib/stats'

export function EmployeeReportPage() {
  const { id = '' } = useParams()
  const { loading, data, employeesById } = useLeaveData()
  const f = useFilters()
  const employee = employeesById.get(id)

  const view = useMemo(() => {
    const own = data.requests.filter((r) => r.employeeId === id)
    // The department filter doesn't apply here — this page is about one person.
    const scoped = filterRequests(own, f.range, { department: null, type: f.type, status: f.status }).sort(
      (a, b) => b.startDate.localeCompare(a.startDate),
    )
    return {
      scoped,
      summary: summarize(scoped, f.range),
      buckets: f.chartRange ? chartBuckets(scoped, f.period, f.chartRange) : [],
      everRequested: own.length,
    }
  }, [data.requests, id, f.range, f.chartRange, f.period, f.type, f.status])

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
      <Link to={{ pathname: '/employees', search: f.search }}>
        <ArrowLeft /> All employees
      </Link>
    </Button>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {back}
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <TilesSkeleton count={5} />
        <CardSkeleton />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <EmptyState icon={UserX} title="Employee not found" description="This person isn’t in the leave sheet." />
        </Card>
      </div>
    )
  }

  const s = view.summary
  const rate = approvalRate(s)

  return (
    <div className="space-y-6">
      {back}
      <div className="flex items-center gap-4">
        <EmployeeAvatar name={employee.name} className="size-14 text-base" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">
            {employee.department ?? 'No department'} · {f.label}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Requests submitted" value={s.total} icon={FileText} hint="in this period" />
        <StatTile label="Approved days" value={formatDays(s.approvedDays)} icon={CalendarCheck2} hint={`${s.approved} approved requests`} />
        <StatTile label="Rejected" value={s.rejected} icon={XCircle} iconClassName="bg-status-rejected-bg text-status-rejected" />
        <StatTile label="Pending" value={s.pending} icon={Clock} iconClassName="bg-status-pending-bg text-status-pending" />
        <StatTile
          label="Approval rate"
          value={rate == null ? '—' : `${Math.round(rate * 100)}%`}
          icon={Percent}
          hint="of decided requests"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Approved leave days</CardTitle>
            <CardDescription>{f.label}, stacked by leave type</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveDaysChart buckets={view.buckets} types={f.type ? [f.type] : undefined} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By leave type</CardTitle>
            <CardDescription>Requests and approved days</CardDescription>
          </CardHeader>
          <CardContent>
            <TypeBreakdown summary={s} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All requests</CardTitle>
          <CardDescription>Newest first · {f.label}</CardDescription>
        </CardHeader>
        <CardContent>
          {view.scoped.length === 0 ? (
            <EmptyState
              description={
                view.everRequested === 0
                  ? `${employee.name} hasn’t submitted any leave requests yet.`
                  : 'Try another period or clear the filters.'
              }
            />
          ) : (
            <RequestsTable requests={view.scoped} showEmployee={false} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
