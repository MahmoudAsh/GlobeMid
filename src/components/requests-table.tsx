import { Link } from 'react-router-dom'
import { CategoryBadges } from '@/components/category'
import { Approx, NotInFsrTag } from '@/components/roster-tag'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { formatDays, formatWeek } from '@/lib/dates'
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
            <TableCell className="text-muted-foreground tabular-nums">{r.id}</TableCell>
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
              {formatWeek(r.weekStart, r.weekEnd)}
              <p className="text-xs text-muted-foreground">{r.weekLabel}</p>
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
