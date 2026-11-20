import { Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/employee-avatar'
import { EmptyState } from '@/components/empty-state'
import { TypeSwatch } from '@/components/leave-type'
import { TableSkeleton } from '@/components/loading'
import { PageHeader } from '@/components/page-header'
import { SortHeader, compareValues, type SortDir } from '@/components/sort-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { formatDate, formatDays } from '@/lib/dates'
import { employeeRows, filterRequests, type EmployeeRow } from '@/lib/stats'
import type { LeaveType } from '@/lib/types'

type Key = 'name' | 'department' | 'total' | 'approved' | 'rejected' | 'pending' | 'approvedDays' | 'Annual' | 'Sick' | 'Casual' | 'lastLeave'
const TYPE_COLS = ['Annual', 'Sick', 'Casual'] as const satisfies readonly LeaveType[]

const value = (r: EmployeeRow, k: Key) =>
  k === 'Annual' || k === 'Sick' || k === 'Casual' ? r.byType[k].approvedDays : r[k]

export function EmployeesPage() {
  const { data, loading } = useLeaveData()
  const f = useFilters()
  const navigate = useNavigate()
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
    const t = { total: 0, approved: 0, rejected: 0, pending: 0, approvedDays: 0, Annual: 0, Sick: 0, Casual: 0 }
    for (const r of visible) {
      t.total += r.total
      t.approved += r.approved
      t.rejected += r.rejected
      t.pending += r.pending
      t.approvedDays += r.approvedDays
      for (const k of TYPE_COLS) t[k] += r.byType[k].approvedDays
    }
    return t
  }, [visible])

  const onSort = (key: Key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'department' ? 'asc' : 'desc' }))

  const open = (id: string) => navigate({ pathname: `/employees/${id}`, search: f.search })

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description={`${rows.length} people · ${f.label}`} />
      {loading ? (
        <TableSkeleton />
      ) : (
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or department"
                className="pl-8"
                aria-label="Search employees"
              />
            </div>

            {visible.length === 0 ? (
              <EmptyState icon={Users} title="No employees match your search" />
            ) : (
              <div className="-mx-4 sm:mx-0">
                <Table className="min-w-[960px]">
                  <TableHeader>
                    <TableRow>
                      <SortHeader label="Name" column="name" sort={sort} onSort={onSort} />
                      <SortHeader label="Department" column="department" sort={sort} onSort={onSort} />
                      <SortHeader label="Requests" column="total" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label="Approved" column="approved" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label="Rejected" column="rejected" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label="Pending" column="pending" sort={sort} onSort={onSort} align="right" />
                      <SortHeader label="Approved days" column="approvedDays" sort={sort} onSort={onSort} align="right" />
                      {TYPE_COLS.map((t) => (
                        <SortHeader key={t} label={t} column={t} sort={sort} onSort={onSort} align="right" />
                      ))}
                      <SortHeader label="Last leave" column="lastLeave" sort={sort} onSort={onSort} />
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
                          <Link
                            to={{ pathname: `/employees/${r.id}`, search: f.search }}
                            className="flex items-center gap-2.5 font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EmployeeAvatar name={r.name} className="size-7" />
                            {r.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{r.department ?? '—'}</TableCell>
                        <Num v={r.total} />
                        <Num v={r.approved} />
                        <Num v={r.rejected} />
                        <Num v={r.pending} />
                        <Num v={r.approvedDays} strong />
                        {TYPE_COLS.map((t) => (
                          <Num key={t} v={r.byType[t].approvedDays} />
                        ))}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {r.lastLeave ? formatDate(r.lastLeave) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">Total ({visible.length})</TableCell>
                      <TableCell />
                      <Num v={totals.total} strong />
                      <Num v={totals.approved} strong />
                      <Num v={totals.rejected} strong />
                      <Num v={totals.pending} strong />
                      <Num v={totals.approvedDays} strong />
                      {TYPE_COLS.map((t) => (
                        <Num key={t} v={totals[t]} strong />
                      ))}
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Annual / Sick / Casual columns show approved days. “Last leave” is the latest approved leave start date.</span>
              {TYPE_COLS.map((t) => (
                <span key={t} className="inline-flex items-center gap-1">
                  <TypeSwatch type={t} /> {t}
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
    <TableCell className={`text-right tabular-nums ${v === 0 ? 'text-muted-foreground/60' : strong ? 'font-semibold' : ''}`}>
      {formatDays(v)}
    </TableCell>
  )
}
