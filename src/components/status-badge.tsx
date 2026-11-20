import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n/i18n-context'
import type { RowStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLES: Record<RowStatus, { icon: typeof CheckCircle2; badge: string; icon_: string }> = {
  approved: { icon: CheckCircle2, badge: 'bg-status-approved-bg text-status-approved', icon_: 'text-status-approved' },
  rejected: { icon: XCircle, badge: 'bg-status-rejected-bg text-status-rejected', icon_: 'text-status-rejected' },
  // Not marked = no status written (e.g. Eid-week allocations). Neutral on purpose — it is not "pending".
  not_marked: { icon: CircleDashed, badge: 'bg-muted text-muted-foreground', icon_: 'text-muted-foreground' },
}

/** Status is always icon + label + colour — never colour alone. */
export function StatusBadge({ status, className }: { status: RowStatus; className?: string }) {
  const { t } = useI18n()
  const { icon: Icon, badge } = STYLES[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', badge, className)}>
      <Icon className="size-3.5" aria-hidden />
      {t.status[status]}
    </span>
  )
}

export function StatusIcon({ status, className }: { status: RowStatus; className?: string }) {
  const { icon: Icon, icon_ } = STYLES[status]
  return <Icon className={cn('size-4', icon_, className)} aria-hidden />
}
