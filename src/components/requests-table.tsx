import { Link } from 'react-router-dom'
import { LeaveTypeLabel } from '@/components/leave-type'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFilters } from '@/context/filters-context'
import { daysInRange, formatDate, formatDays, formatRange } from '@/lib/dates'
import type { LeaveRequest } from '@/lib/types'

/** Days of the request, plus how many fall in the selected period when it's only partly inside. */
export function DaysCell({ req }: { req: LeaveRequest }) {
  const { range } = useFilters()
  const inPeriod = daysInRange(req, range)
  const clipped = Math.abs(inPeriod - req.days) > 1e-9
  return (
    <TableCell className="text-right whitespace-nowrap tabular-nums">
      <span className="font-medium">{formatDays(req.days)}</span>
      {clipped && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="ml-1 cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
              ({formatDays(inPeriod)} in period)
            </span>
          </TooltipTrigger>
          <TooltipContent>This request is only partly inside the selected period</TooltipContent>
        </Tooltip>
      )}
    </TableCell>
  )
}

export function RequestsTable({ requests, showEmployee = true }: { requests: LeaveRequest[]; showEmployee?: boolean }) {
  const { search } = useFilters()
  return (
    <Table className={showEmployee ? 'min-w-[1000px]' : 'min-w-[760px]'}>
      <TableHeader>
        <TableRow>
          {showEmployee && <TableHead>Employee</TableHead>}
          <TableHead>Dates</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Days</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r) => (
          <TableRow key={r.id}>
            {showEmployee && (
              <TableCell>
                <Link
                  to={{ pathname: `/employees/${r.employeeId}`, search }}
                  className="font-medium whitespace-nowrap hover:underline"
                >
                  {r.employee}
                </Link>
                <p className="text-xs text-muted-foreground">{r.department}</p>
              </TableCell>
            )}
            <TableCell className="whitespace-nowrap">{formatRange(r.startDate, r.endDate)}</TableCell>
            <TableCell>
              <LeaveTypeLabel type={r.type} />
            </TableCell>
            <DaysCell req={r} />
            <TableCell className="max-w-64 truncate text-muted-foreground" title={r.reason}>
              {r.reason || '—'}
            </TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {r.submittedAt ? formatDate(r.submittedAt) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
