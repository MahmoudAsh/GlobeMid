import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataCheck } from '@/components/data-check'
import { EmptyState } from '@/components/empty-state'
import { TableSkeleton } from '@/components/loading'
import { PageHeader } from '@/components/page-header'
import { RequestsTable } from '@/components/requests-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLeaveData } from '@/context/data-context'
import { useFilters } from '@/context/filters-context'
import { useI18n } from '@/i18n/i18n-context'
import { filterRequests } from '@/lib/stats'

const PAGE_SIZE = 15

export function RequestsPage() {
  const { data, loading } = useLeaveData()
  const f = useFilters()
  const [query, setQuery] = useState('')
  const { t } = useI18n()
  const rq = t.requests
  const [page, setPage] = useState(0)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return filterRequests(data.requests, f.range, { department: f.department, type: f.type, status: f.status })
      .filter((r) => !q || r.employee.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          b.startDate.localeCompare(a.startDate) ||
          (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '') ||
          a.employee.localeCompare(b.employee),
      )
  }, [data.requests, f.range, f.department, f.type, f.status, query])

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const rows = list.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title={rq.title} description={rq.subtitle(list.length, f.label)} />
      <DataCheck />
      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder={t.common.searchNameOrReason}
                className="ps-8"
                aria-label={rq.searchLabel}
              />
            </div>

            {rows.length === 0 ? (
              <EmptyState
                description={query ? rq.noMatch : t.common.tryAnother}
              />
            ) : (
              <>
                <RequestsTable requests={rows} />
                <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span className="tabular-nums">
                    {rq.range(current * PAGE_SIZE + 1, current * PAGE_SIZE + rows.length, list.length)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(current - 1)}
                      disabled={current === 0}
                      aria-label={rq.prevPage}
                    >
                      <ChevronLeft className="rtl:rotate-180" /> {rq.prev}
                    </Button>
                    <span className="tabular-nums">{rq.page(current + 1, pages)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(current + 1)}
                      disabled={current >= pages - 1}
                      aria-label={rq.nextPage}
                    >
                      {rq.next} <ChevronRight className="rtl:rotate-180" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
