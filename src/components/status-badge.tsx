import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/constants'
import type { LeaveStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLES: Record<LeaveStatus, { icon: typeof Clock; className: string }> = {
  approved: { icon: CheckCircle2, className: 'bg-status-approved-bg text-status-approved' },
  rejected: { icon: XCircle, className: 'bg-status-rejected-bg text-status-rejected' },
  pending: { icon: Clock, className: 'bg-status-pending-bg text-status-pending' },
}

/** Status is always icon + label + colour — never colour alone. */
export function StatusBadge({ status, className }: { status: LeaveStatus; className?: string }) {
  const { icon: Icon, className: tone } = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  )
}

export function StatusIcon({ status, className }: { status: LeaveStatus; className?: string }) {
  const { icon: Icon } = STYLES[status]
  const color = { approved: 'text-status-approved', rejected: 'text-status-rejected', pending: 'text-status-pending' }[status]
  return <Icon className={cn('size-4', color, className)} aria-hidden />
}
