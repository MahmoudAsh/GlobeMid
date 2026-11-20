import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/i18n/i18n-context'
import { formatDays } from '@/lib/dates'
import type { Bucket } from '@/lib/stats'

/** One series: annual days per bucket (month or sheet week). The title names the series, so no legend. */
export function AnnualChart({ buckets }: { buckets: Bucket[] }) {
  const { t, dir } = useI18n()
  const config = { annualDays: { label: t.category.annual, color: 'var(--cat-annual)' } } satisfies ChartConfig
  const rtl = dir === 'rtl'
  if (buckets.every((b) => b.annualDays === 0)) return <EmptyState description={t.chart.noData} />

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart
        data={buckets}
        margin={rtl ? { top: 8, right: -16, left: 4, bottom: 0 } : { top: 8, right: 4, left: -16, bottom: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" reversed={rtl} tickLine={false} axisLine={false} tickMargin={8} minTickGap={4} interval="preserveStartEnd" />
        <YAxis orientation={rtl ? 'right' : 'left'} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<BucketTooltip />} />
        <Bar dataKey="annualDays" fill="var(--color-annualDays)" radius={[4, 4, 0, 0]} maxBarSize={48} animationDuration={300} />
      </BarChart>
    </ChartContainer>
  )
}

function BucketTooltip({ active, payload }: { active?: boolean; payload?: { payload?: Bucket }[] }) {
  const { t } = useI18n()
  const b = payload?.[0]?.payload
  if (!active || !b) return null
  return (
    <div className="grid min-w-40 gap-1 rounded-lg border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{b.title}</p>
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: 'var(--cat-annual)' }} />
        <span className="text-muted-foreground">{t.category.annual}</span>
        <span className="ms-auto ps-3 font-medium tabular-nums">{t.units.days(formatDays(b.annualDays), b.annualDays)}</span>
      </div>
      <p className="text-muted-foreground">{t.chart.tooltipRows(b.rows)}</p>
    </div>
  )
}
