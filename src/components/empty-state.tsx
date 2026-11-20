import { CalendarX2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/i18n-context'

export function EmptyState({
  title,
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
  const { t } = useI18n()
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-10 text-center', className)}>
      <span className="rounded-full bg-muted p-3 text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-medium">{title ?? t.common.noLeaveTitle}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
