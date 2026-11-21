import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CategoryBadges } from '@/components/category'
import { Approx, NotInFsrTag } from '@/components/roster-tag'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFilters } from '@/context/filters-context'
import { useLeaveActions } from '@/context/leave-actions'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/i18n-context'
import { formatDays, formatRangeExact, formatWeek } from '@/lib/dates'
import type { LeaveRow } from '@/lib/types'

/** Request text + note (partial decisions like "الخميس Rejected" live in the note). */
export function RequestText({ row }: { row: LeaveRow }) {
  const { t } = useI18n()
  return (
    <div className="min-w-48 space-y-0.5">
      <p dir="auto">{row.requestText || '—'}</p>
      {row.note && (
        <p dir="auto" className="text-xs text-status-pending">
          {t.common.note}: {row.note}
        </p>
      )}
    </div>
  )
}

export function DaysCells({ row }: { row: LeaveRow }) {
  const hasOther = row.categories.some((c) => c !== 'annual')
  return (
    <>
      <TableCell className="text-end tabular-nums" title={row.annualCell || undefined}>
        {row.annualDays ? <span className="font-medium">{formatDays(row.annualDays)}</span> : <span className="text-muted-foreground/60">—</span>}
      </TableCell>
      <TableCell className="text-end whitespace-nowrap tabular-nums">
        {hasOther && row.otherDays ? (
          <>
            <Approx /> {formatDays(row.otherDays)}
          </>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </TableCell>
    </>
  )
}

export function RequestsTable({ rows }: { rows: LeaveRow[] }) {
  const { search } = useFilters()
  const { t } = useI18n()
  const c = t.requests.col
  return (
    <Table className="min-w-[1050px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">{c.row}</TableHead>
          <TableHead>{c.employee}</TableHead>
          <TableHead>{c.week}</TableHead>
          <TableHead>{c.request}</TableHead>
          <TableHead>{c.categories}</TableHead>
          <TableHead>{c.status}</TableHead>
          <TableHead className="text-end">{c.annual}</TableHead>
          <TableHead className="text-end">{c.other}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} className="align-top">
            <TableCell className="text-muted-foreground tabular-nums">
              <RowRef row={r} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Link to={{ pathname: `/employees/${r.employeeId}`, search }} className="font-medium whitespace-nowrap hover:underline">
                  {r.employee}
                </Link>
                {!r.inFsrList && <NotInFsrTag />}
              </div>
              {r.rawName !== r.employee && <p className="text-xs text-muted-foreground">{t.common.writtenAs(r.rawName)}</p>}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {r.exactStart && r.exactEnd ? (
                <>
                  {formatRangeExact(r.exactStart, r.exactEnd)}
                  <p className="text-xs text-muted-foreground">{t.common.week}: {formatWeek(r.weekStart, r.weekEnd)}</p>
                </>
              ) : (
                <>
                  {formatWeek(r.weekStart, r.weekEnd)}
                  <p className="text-xs text-muted-foreground">{r.weekLabel}</p>
                </>
              )}
            </TableCell>
            <TableCell>
              <RequestText row={r} />
            </TableCell>
            <TableCell>
              <CategoryBadges categories={r.categories} />
            </TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
            <DaysCells row={r} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Sheet row number, or an "Added in app" badge with a delete button for requests added from the dashboard. */
export function RowRef({ row }: { row: LeaveRow }) {
  const { t } = useI18n()
  const { remove, canWrite } = useLeaveActions()
  if (row.source !== 'app') return <span>{row.id}</span>
  return (
    <span className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-accent-foreground">{t.form.appBadge}</span>
        </TooltipTrigger>
        <TooltipContent>{t.form.appBadgeHint(row.exactStart ? formatRangeExact(row.exactStart, row.exactEnd ?? row.exactStart) : row.weekLabel)}</TooltipContent>
      </Tooltip>
      {canWrite && (
        <Button type="button" variant="ghost" size="icon-xs" aria-label={t.form.delete} title={t.form.delete} onClick={() => void remove(row)}>
          <Trash2 className="text-muted-foreground" />
        </Button>
      )}
    </span>
  )
}
