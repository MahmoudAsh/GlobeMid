import { UserRoundX } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/i18n-context'

/** Small tag for people who appear in requests but not in the roster tab. */
export function NotInRosterTag() {
  const { t } = useI18n()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 cursor-help items-center gap-1 rounded-full border border-dashed px-1.5 py-px text-[11px] font-normal whitespace-nowrap text-muted-foreground">
          <UserRoundX className="size-3" aria-hidden />
          {t.common.notInRoster}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t.common.notInRosterHint}</TooltipContent>
    </Tooltip>
  )
}
