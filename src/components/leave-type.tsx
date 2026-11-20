import { LEAVE_TYPE_COLORS } from '@/lib/constants'
import type { LeaveType } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Swatch with the leave type's fixed colour (CSS vars set in <LeaveTypeColorVars/>). */
export function TypeSwatch({ type, className }: { type: LeaveType; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', className)}
      style={{ backgroundColor: `var(--leave-${type.toLowerCase()})` }}
    />
  )
}

export function LeaveTypeLabel({ type, className }: { type: LeaveType; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <TypeSwatch type={type} />
      {type}
    </span>
  )
}

/** Defines --leave-annual etc. for light and dark mode, from the single colour table. */
export function LeaveTypeColorVars() {
  const entries = Object.entries(LEAVE_TYPE_COLORS)
  const css = `:root{${entries.map(([t, c]) => `--leave-${t.toLowerCase()}:${c.light};`).join('')}}
.dark{${entries.map(([t, c]) => `--leave-${t.toLowerCase()}:${c.dark};`).join('')}}`
  return <style>{css}</style>
}
