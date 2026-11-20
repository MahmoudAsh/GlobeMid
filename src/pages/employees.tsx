import { AlertTriangle, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/employee-avatar'
import { EmptyState } from '@/components/empty-state'
import { TableSkeleton } from '@/components/loading'
import { PageHeader } from '@/components/page-header'
import { NotInFsrTag } from '@/components/roster-tag'
import { SortHeader, compareValues, type SortDir } from '@/components/sort-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { SHEET_CONFIG } from '@/lib/config'
import { formatDate } from '@/lib/format'
import { formatDays } from '@/lib/dates'
import { employeeStats, filterRows, type EmployeeStats } from '@/lib/stats'
import { cn } from '@/lib/utils'

type Key =
  | 'name'
  | 'rows'
  | 'approved'
  | 'rejected'
  | 'notMarked'
  | 'annualDays'
  | 'sickDays'
  | 'holidayDays'
  | 'birthdays'
  | 'offChanges'
  | 'cancelledOffs'
  | 'fsrAnnualUsed'
  | 'computedAnnualUsed'

const value = (e: EmployeeStats, k: Key): string | number | null => {
  switch (k) {
    case 'rows':
    case 'approved':
    case 'rejected':
    case 'notMarked':
    case 'annualDays':
      return e.summary[k]
    default:
      return e[k]
  }
}

/** Columns that are summed in the footer (FSR/computed are all-time counters, not period values). */
const SUMMED: Key[] = ['rows', 'approved', 'rejected', 'notMarked', 'annualDays', 'sickDays', 'holidayDays', 'birthdays', 'offChanges', 'cancelledOffs']

export function EmployeesPage() {
  const { data, loading } = useLeaveData()
  const f = useFilters()
  const navigate = useNavigate()
  const { t } = useI18n()
  const c = t.employees.col
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'fsr' | 'all'>('all')
  const [sort, setSort] = useState<{ key: Key; dir: SortDir }>({ key: 'name', dir: 'asc' })
  const since = formatDate(SHEET_CONFIG.fsrCounterStart)

  const rows = useMemo(() => {
    const scoped = filterRows(data.rows, f.range, { category: f.category, status: f.status })
    return employeeStats(data.employees, scoped, data.rows, SHEET_CONFIG.fsrCounterStart)
  }, [data, f.range, f.category, f.status])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter(
      (r) => (scope === 'all' || r.inFsrList) && (!q || r.name.toLowerCase().includes(q) || r.variants.some((v) => v.raw.toLowerCase().includes(q))),
    )
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => compareValues(value(a, sort.key), value(b, sort.key)) * dir || a.name.localeCompare(b.name))
  }, [rows, query, scope, sort])

  const totals = useMemo(() => Object.fromEntries(SUMMED.map((k) => [k, visible.reduce((n, r) => n + Number(value(r, k) ?? 0), 0)])), [visible])
  const onSort = (key: Key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  const open = (id: string) => navigate({ pathname: `/employees/${id}`, search: f.search })
  const H = (label: string, k: Key, right = true) => <SortHeader label={label} column={k} sort={sort} onSort={onSort} align={right ? 'right' : 'left'} />

  return (
    <div className="space-y-6">
      <PageHeader title={t.employees.title} description={t.employees.subtitle(visible.length, f.label)} />
      {loading ? (
        <TableSkeleton />
      ) : (
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.employees.search} className="ps-8" aria-label={t.employees.searchLabel} />
              </div>
              <Tabs value={scope} onValueChange={(v) => setScope(v as 'fsr' | 'all')}>
                <TabsList>
                  <TabsTrigger value="all">{t.employees.scope.all}</TabsTrigger>
                  <TabsTrigger value="fsr">{t.employees.scope.fsr}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {visible.length === 0 ? (
              <EmptyState icon={Users} title={t.employees.noMatch} />
            ) : (
              <Table className="min-w-[1250px]">
                <TableHeader>
                  <TableRow>
                    {H(c.name, 'name', false)}
                    {H(c.requests, 'rows')}
                    {H(c.approved, 'approved')}
                    {H(c.rejected, 'rejected')}
                    {H(c.notMarked, 'notMarked')}
                    {H(c.annualDays, 'annualDays')}
                    {H(c.sickDays, 'sickDays')}
                    {H(c.holidays, 'holidayDays')}
                    {H(c.birthdays, 'birthdays')}
                    {H(c.offChanges, 'offChanges')}
                    {H(c.cancelledOffs, 'cancelledOffs')}
                    {H(c.fsrUsed, 'fsrAnnualUsed')}
                    {H(c.computedUsed, 'computedAnnualUsed')}
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => open(r.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to={{ pathname: `/employees/${r.id}`, search: f.search }} className="flex items-center gap-2.5 font-medium whitespace-nowrap hover:underline" onClick={(e) => e.stopPropagation()}>
                            <EmployeeAvatar name={r.name} className="size-7" />
                            {r.name}
                          </Link>
                          {!r.inFsrList && <NotInFsrTag />}
                        </div>
                      </TableCell>
                      <Num v={r.summary.rows} />
                      <Num v={r.summary.approved} />
                      <Num v={r.summary.rejected} />
                      <Num v={r.summary.notMarked} />
                      <Num v={r.summary.annualDays} strong />
                      <Num v={r.sickDays} />
                      <Num v={r.holidayDays} />
                      <Num v={r.birthdays} />
                      <Num v={r.offChanges} />
                      <Num v={r.cancelledOffs} />
                      <TableCell className="border-s text-end tabular-nums">{r.fsrAnnualUsed ?? <span className="text-muted-foreground/60">—</span>}</TableCell>
                      <TableCell className={cn('text-end tabular-nums', r.fsrMismatch && 'font-semibold text-status-pending')}>
                        {r.inFsrList ? formatDays(r.computedAnnualUsed) : <span className="text-muted-foreground/60">—</span>}
                      </TableCell>
                      <TableCell className="w-8 px-1">
                        {r.fsrMismatch && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="size-4 text-status-pending" aria-label={t.employees.mismatch(r.fsrAnnualUsed!, r.computedAnnualUsed)} />
                            </TooltipTrigger>
                            <TooltipContent>{t.employees.mismatch(r.fsrAnnualUsed!, r.computedAnnualUsed)}</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">{t.employees.totalRow(visible.length)}</TableCell>
                    {SUMMED.map((k) => (
                      <Num key={k} v={totals[k]} strong />
                    ))}
                    <TableCell className="border-s" />
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            )}
            <p className="text-xs text-muted-foreground">{t.employees.footnote(since)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Num({ v, strong }: { v: number; strong?: boolean }) {
  return (
    <TableCell className={cn('text-end tabular-nums', v === 0 ? 'text-muted-foreground/60' : strong && 'font-semibold')}>{formatDays(v)}</TableCell>
  )
}
