import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  iconClassName?: string
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn('rounded-lg bg-accent p-2 text-primary', iconClassName)}>
          <Icon className="size-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  )
}
