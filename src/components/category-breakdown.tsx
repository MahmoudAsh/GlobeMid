import { CategoryLabel } from '@/components/category'
import { EmptyState } from '@/components/empty-state'
import { Approx } from '@/components/roster-tag'
import { useI18n } from '@/i18n/i18n-context'
import { CATEGORIES } from '@/lib/categories'
import { formatDays } from '@/lib/dates'
import type { Summary } from '@/lib/stats'

/** Rows per category, with days (exact for annual, approx. for the rest) and a proportional bar. */
export function CategoryBreakdown({ summary }: { summary: Summary }) {
  const { t } = useI18n()
  const rows = CATEGORIES.map((c) => ({ c, ...summary.byCategory[c] }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
  if (rows.length === 0) return <EmptyState className="py-6" />
  const max = Math.max(...rows.map((r) => r.count))
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.c} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <CategoryLabel category={r.c} className="font-medium" />
            <span className="text-muted-foreground tabular-nums">
              {t.units.rows(r.count)} · {r.c !== 'annual' && <Approx />}
              {t.units.days(formatDays(r.days), r.days)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, backgroundColor: `var(--cat-${r.c})` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
