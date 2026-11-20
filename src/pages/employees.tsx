import { Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/employee-avatar'
import { EmptyState } from '@/components/empty-state'
import { TypeSwatch } from '@/components/leave-type'
import { TableSkeleton } from '@/components/loading'
import { PageHeader } from '@/components/page-header'
import { NotInRosterTag } from '@/components/roster-tag'
import { SortHeader, compareValues, type SortDir } from '@/components/sort-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { formatDate, formatDays } from '@/lib/dates'
import { employeeRows, filterRequests, type EmployeeRow } from '@/lib/stats'
import type { LeaveType } from '@/lib/types'

type Key = 'name' | 'department' | 'total' | 'approved' | 'rejected' | 'pending' | 'approvedDays' | 'Annual' | 'Sick' | 'lastLeave'
const TYPE_COLS = ['Annual', 'Sick'] as const satisfies readonly LeaveType[]

const value = (r: EmployeeRow, k: Key) =>
  k === 'Annual' || k === 'Sick' ? r.byType[k].approvedDays : r[k]

export function EmployeesPage() {
  const { data, loading, hasDepartments } = useLeaveData()
  const f = useFilters()
  const navigate = useNavigate()
  const { t } = useI18n()
  const c = t.employees.col
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: Key; dir: SortDir }>({ key: 'name', dir: 'asc' })

  const rows = useMemo(() => {
    const scoped = filterRequests(data.requests, f.range, { department: f.department, type: f.type, status: f.status })
    const employees = f.department ? data.employees.filter((e) => e.department === f.department) : data.employees
    return employeeRows(employees, scoped, f.range)
  }, [data, f.range, f.department, f.type, f.status])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q) || (r.department ?? '').toLowerCase().includes(q))
      : rows
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => compareValues(value(a, sort.key), value(b, sort.key)) * dir || a.name.localeCompare(b.name))
  }, [rows, query, sort])

  const totals = useMemo(() => {
    const sum = { total: 0, approved: 0, rejected: 0, pending: 0, approvedDays: 0, Annual: 0, Sick: 0 }
    for (const r of visible) {
      sum.total += r.total
      sum.approved += r.approved
      sum.rejected += r.rejected
      sum.pending += r.pending
      sum.approvedDays += r.approvedDays
      for (const k of TYPE_COLS) sum[k] += r.byType[k].approvedDays
    }
    return sum
  }, [visible])

  const onSort = (key: Key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'department' ? 'asc' : 'desc' }))

  const open = (id: string) => navigate({ pathname: `/employees/${id}`, search: f.search })

  return (
    <div className="space-y-6">
      <PageHeader title={t.employees.title} description={t.employees.subtitle(rows.length, f.label)} />
      {loading ? (
        <TableSkeleton />
      ) : (
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={hasDepartments ? t.employees.search : t.employees.searchName}
                className="ps-8"
                aria-label={t.employees.searchLabel}
              />
            </div>

            {visible.length === 0 ? (
              <EmptyState icon={Users} title={t.employees.noMatch} />
            ) : (
              <div className="-mx-4 sm:mx-0">
                <Table className={hasDepartments ? 'min-w-[960px]' : 'min-w-[820px]'}>
                  <TableHeader>
                    <TableRow>
                      <SortHeader label={c.name} column="name" sort={sort} onSort={onSort} />
                      {hasDepartments && <SortHeader label={c.department} column="department" sort={sort} onSort={onSort} />}
                      <SortHeader label={c.requests} column="total" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label={c.approved} column="approved" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label={c.rejected} column="rejected" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label={c.pending} column="pending" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label={c.approvedDays} column="approvedDays" sort={sort} onSort={onSort} align="right" />
                      {TYPE_COLS.map((type) => (
                        <SortHeader key={type} label={t.leaveType[type]} column={type} sort={sort} onSort={onSort} align="right" />
                      ))}
                      <SortHeader label={c.lastLeave} column="lastLeave" sort={sort} onSort={onSort} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => open(r.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link
                              to={{ pathname: `/employees/${r.id}`, search: f.search }}
                              className="flex items-center gap-2.5 font-medium whitespace-nowrap hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EmployeeAvatar name={r.name} className="size-7" />
                              {r.name}
                            </Link>
                            {!r.inRoster && <NotInRosterTag />}
                          </div>
                        </TableCell>
                        {hasDepartments && <TableCell className="text-muted-foreground">{r.department ?? '—'}</TableCell>}
                        <Num v={r.total} />
                        <Num v={r.approved} />
                        <Num v={r.rejected} />
                        <Num v={r.pending} />
                        <Num v={r.approvedDays} strong />
                        {TYPE_COLS.map((type) => (
                          <Num key={type} v={r.byType[type].approvedDays} />
                        ))}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {r.lastLeave ? formatDate(r.lastLeave) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">{t.employees.totalRow(visible.length)}</TableCell>
                      {hasDepartments && <TableCell />}
                      <Num v={totals.total} strong />
                      <Num v={totals.approved} strong />
                      <Num v={totals.rejected} strong />
                      <Num v={totals.pending} strong />
                      <Num v={totals.approvedDays} strong />
                      {TYPE_COLS.map((type) => (
                        <Num key={type} v={totals[type]} strong />
                      ))}
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{t.employees.footnote}</span>
              {TYPE_COLS.map((type) => (
                <span key={type} className="inline-flex items-center gap-1">
                  <TypeSwatch type={type} /> {t.leaveType[type]}
                </span>
              ))}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Num({ v, strong }: { v: number; strong?: boolean }) {
  return (
    <TableCell className={`text-end tabular-nums ${v === 0 ? 'text-muted-foreground/60' : strong ? 'font-semibold' : ''}`}>
      {formatDays(v)}
    </TableCell>
  )
}
