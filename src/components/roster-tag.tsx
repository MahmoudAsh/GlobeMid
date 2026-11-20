import { UserRoundX } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/i18n-context'

/** Tag for people who appear in the sheet but not in the FSRs list. */
export function NotInFsrTag() {
  const { t } = useI18n()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 cursor-help items-center gap-1 rounded-full border border-dashed px-1.5 py-px text-[11px] font-normal whitespace-nowrap text-muted-foreground">
          <UserRoundX className="size-3" aria-hidden />
          {t.common.notInFsr}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t.common.notInFsrHint}</TooltipContent>
    </Tooltip>
  )
}

/** "≈" marker with an explanation, for approximate (non-annual) day counts. */
export function Approx() {
  const { t } = useI18n()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help text-muted-foreground" aria-label={t.units.approxHint}>
          {t.units.approx}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t.units.approxHint}</TooltipContent>
    </Tooltip>
  )
}
