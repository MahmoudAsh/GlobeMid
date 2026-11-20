import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function initials(name: string) {
  const parts = name.replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function EmployeeAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn('size-8', className)}>
      <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
