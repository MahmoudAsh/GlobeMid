import { LeaveTypeLabel } from '@/components/leave-type'
import { EmptyState } from '@/components/empty-state'
import { LEAVE_TYPES } from '@/lib/constants'
import { formatDays } from '@/lib/dates'
import type { Summary } from '@/lib/stats'

/** Requests and approved days per leave type, with a proportional bar. */
export function TypeBreakdown({ summary }: { summary: Summary }) {
  const rows = LEAVE_TYPES.map((t) => ({ type: t, ...summary.byType[t] })).filter((r) => r.count > 0)
  if (rows.length === 0) return <EmptyState className="py-6" />
  const maxDays = Math.max(1, ...rows.map((r) => r.approvedDays))

  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.type} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <LeaveTypeLabel type={r.type} className="font-medium" />
            <span className="text-muted-foreground tabular-nums">
              {r.count} {r.count === 1 ? 'request' : 'requests'} ·{' '}
              <span className="font-medium text-foreground">{formatDays(r.approvedDays)}</span> approved days
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(r.approvedDays / maxDays) * 100}%`,
                backgroundColor: `var(--leave-${r.type.toLowerCase()})`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
