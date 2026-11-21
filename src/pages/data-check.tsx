import { CheckCircle2 } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TableSkeleton } from '@/components/loading'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { SHEET_CONFIG } from '@/lib/config'
import { formatDays } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { employeeStats } from '@/lib/stats'
import { cn } from '@/lib/utils'

/** Everything needed to verify the numbers with the manager, independent of the period filter. */
export function DataCheckPage() {
  const { data, loading } = useLeaveData()
  const { search } = useFilters()
  const { t } = useI18n()
  const dc = t.dataCheck
  const since = formatDate(SHEET_CONFIG.fsrCounterStart)

  const fsr = useMemo(() => {
    const stats = employeeStats(data.employees, data.rows, data.rows, SHEET_CONFIG.fsrCounterStart).filter(
      (e) => e.inFsrList && e.fsrAnnualUsed != null,
    )
    return {
      total: stats.length,
      matched: stats.filter((e) => !e.fsrMismatch).length,
      mismatches: stats.filter((e) => e.fsrMismatch).sort((a, b) => Math.abs(b.computedAnnualUsed - b.fsrAnnualUsed!) - Math.abs(a.computedAnnualUsed - a.fsrAnnualUsed!)),
    }
  }, [data])

  if (loading) return <TableSkeleton />
  const i = data.issues
  const rows = (ns: number[]) => ns.join(', ')

  return (
    <div className="space-y-6">
      <PageHeader title={dc.title} description={dc.subtitle} />

      <Section title={dc.summary}>
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Item label={dc.rawRows} value={data.rawRowCount} />
          <Item label={dc.parsedRows} value={data.rows.length - data.app.count} />
          <Item label={dc.appRows} value={data.app.available ? data.app.count : dc.appUnavailable} />
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{dc.rawStatuses}</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {Object.entries(data.rawStatusCounts).map(([k, v]) => (
                <span key={k} className="rounded-md border px-2 py-0.5 tabular-nums">
                  {k === '(empty)' ? dc.empty : k}: <b>{v}</b>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </Section>

      <Section title={dc.unparsedWeeks} hint={dc.unparsedWeeksHint} count={i.unparsedWeeks.length}>
        <SimpleTable head={[dc.colRow, dc.colName, dc.colWeek]} rows={i.unparsedWeeks.map((r) => [r.row, r.name, r.week || dc.empty])} />
      </Section>

      <Section title={dc.nonSaturday} hint={dc.nonSaturdayHint} count={i.nonSaturdayWeeks.length}>
        <SimpleTable head={[dc.colRow, dc.colWeek, dc.colStart]} rows={i.nonSaturdayWeeks.map((r) => [r.row, r.weekLabel, r.start])} />
      </Section>

      <Section title={dc.unmatched} hint={dc.unmatchedHint} count={i.unmatchedNames.length}>
        <SimpleTable
          head={[dc.colName, dc.colCount, dc.colRows]}
          rows={i.unmatchedNames.map((u) => [u.name, u.count, <span className="text-xs text-muted-foreground">{rows(u.rows)}</span>])}
        />
      </Section>

      <Section title={dc.unclassified} hint={dc.unclassifiedHint} count={i.unclassified.length}>
        <SimpleTable
          head={[dc.colText, dc.colCount, dc.colRows]}
          rows={i.unclassified.map((u) => [<span dir="auto">{u.text}</span>, u.count, <span className="text-xs text-muted-foreground">{rows(u.rows)}</span>])}
        />
      </Section>

      <Section title={dc.fsr} hint={dc.fsrHint(since, fsr.matched, fsr.total)} count={fsr.mismatches.length}>
        <SimpleTable
          head={[dc.colName, dc.colFsr, dc.colComputed, dc.colDiff, dc.colAllTime]}
          rows={fsr.mismatches.map((e) => {
            const diff = e.computedAnnualUsed - e.fsrAnnualUsed!
            return [
              <Link to={{ pathname: `/employees/${e.id}`, search }} className="font-medium hover:underline">
                {e.name}
              </Link>,
              e.fsrAnnualUsed,
              formatDays(e.computedAnnualUsed),
              <span className={cn('font-medium', diff > 0 ? 'text-status-rejected' : 'text-status-pending')}>{diff > 0 ? `+${diff}` : diff}</span>,
              formatDays(data.rows.filter((r) => r.employeeId === e.id).reduce((n, r) => n + r.annualDays, 0)),
            ]
          })}
        />
      </Section>

      {i.emptyNameRows.length > 0 && (
        <Section title={dc.emptyNames} count={i.emptyNameRows.length} neutral>
          <SimpleTable head={[dc.colRow, dc.colWeek]} rows={i.emptyNameRows.map((r) => [r.row, r.week || dc.empty])} />
        </Section>
      )}
    </div>
  )
}

function Section({ title, hint, count, neutral, children }: { title: string; hint?: string; count?: number; neutral?: boolean; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                count === 0 ? 'bg-status-approved-bg text-status-approved' : neutral ? 'bg-muted text-muted-foreground' : 'bg-status-pending-bg text-status-pending',
              )}
            >
              {count}
            </span>
          )}
        </CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="flex items-center gap-2 text-sm text-status-approved">
            <CheckCircle2 className="size-4" aria-hidden /> {t.dataCheck.allGood}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function SimpleTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="max-h-[28rem] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {head.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((cell, j) => (
                <TableCell key={j} className="align-top">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
