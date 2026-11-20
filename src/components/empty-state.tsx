import { CalendarX2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  title = 'No leave in this period',
  description,
  icon: Icon = CalendarX2,
  className,
  children,
}: {
  title?: string
  description?: ReactNode
  icon?: LucideIcon
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-10 text-center', className)}>
      <span className="rounded-full bg-muted p-3 text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
