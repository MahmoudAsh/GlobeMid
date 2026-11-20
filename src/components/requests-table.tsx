import { Link } from 'react-router-dom'
import { LeaveTypeLabel } from '@/components/leave-type'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFilters } from '@/context/filters-context'
import { daysInRange, formatDate, formatDays, formatRange } from '@/lib/dates'
import type { LeaveRequest } from '@/lib/types'
import { useI18n } from '@/i18n/i18n-context'

/** Days of the request, plus how many fall in the selected period when it's only partly inside. */
export function DaysCell({ req }: { req: LeaveRequest }) {
  const { range } = useFilters()
  const { t } = useI18n()
  const inPeriod = daysInRange(req, range)
  const clipped = req.days > 0 && Math.abs(inPeriod - req.days) > 1e-9
  return (
    <TableCell className="text-end whitespace-nowrap tabular-nums">
      {req.days === 0 ? <span className="text-muted-foreground/60">—</span> : <span className="font-medium">{formatDays(req.days)}</span>}
      {clipped && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="ms-1 cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
              {t.requests.inPeriod(formatDays(inPeriod))}
            </span>
          </TooltipTrigger>
          <TooltipContent>{t.requests.partlyInPeriod}</TooltipContent>
        </Tooltip>
      )}
    </TableCell>
  )
}

export function RequestsTable({ requests, showEmployee = true }: { requests: LeaveRequest[]; showEmployee?: boolean }) {
  const { search } = useFilters()
  const { t } = useI18n()
  const c = t.requests.col
  // The weekly sheet has no submission date — hide the column instead of showing a row of dashes.
  const showSubmitted = requests.some((r) => r.submittedAt)
  return (
    <Table className={showEmployee ? 'min-w-[1000px]' : 'min-w-[760px]'}>
      <TableHeader>
        <TableRow>
          {showEmployee && <TableHead>{c.employee}</TableHead>}
          <TableHead>{c.dates}</TableHead>
          <TableHead>{c.type}</TableHead>
          <TableHead className="text-end">{c.days}</TableHead>
          <TableHead>{c.reason}</TableHead>
          <TableHead>{c.status}</TableHead>
          {showSubmitted && <TableHead>{c.submitted}</TableHead>}
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
                {(r.department || r.employeeRaw) && (
                  <p className="text-xs text-muted-foreground">{r.department ?? t.common.writtenAs(r.employeeRaw!)}</p>
                )}
              </TableCell>
            )}
            <TableCell className="whitespace-nowrap">{formatRange(r.startDate, r.endDate)}</TableCell>
            <TableCell>
              <LeaveTypeLabel type={r.type} />
            </TableCell>
            <DaysCell req={r} />
            <TableCell className="max-w-80 min-w-56 text-muted-foreground">
              {r.reason || '—'}
            </TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
            {showSubmitted && (
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {r.submittedAt ? formatDate(r.submittedAt) : '—'}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
