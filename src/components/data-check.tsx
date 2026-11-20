import { TriangleAlert } from 'lucide-react'
import { useLeaveData } from '@/context/data-context'
import { useI18n } from '@/i18n/i18n-context'

/** Lists sheet rows that couldn't be read, so they can be fixed in the sheet. Hidden when all rows are fine. */
export function DataCheck() {
  const { data, loading } = useLeaveData()
  const { t } = useI18n()
  const rows = data.skippedRows ?? []
  if (loading || rows.length === 0) return null
  return (
    <div
      role="status"
      className="flex gap-3 rounded-xl border border-status-pending/30 bg-status-pending-bg/60 px-4 py-3 text-sm"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-pending" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{t.dataCheck.title(rows.length)}</p>
        <ul className="space-y-0.5 text-muted-foreground">
          {rows.slice(0, 10).map((r) => (
            <li key={r.row}>{t.dataCheck.row(r.row, r.name, r.reason)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
