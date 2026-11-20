import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/i18n/i18n-context'
import { LEAVE_TYPES } from '@/lib/constants'
import { formatDays } from '@/lib/dates'
import type { ChartBucket } from '@/lib/stats'
import type { LeaveType } from '@/lib/types'

/** Stacked bars of approved leave days per bucket, by leave type. */
export function LeaveDaysChart({ buckets, types }: { buckets: ChartBucket[]; types?: LeaveType[] }) {
  const { t, dir } = useI18n()
  const config = useMemo(
    () =>
      Object.fromEntries(
        LEAVE_TYPES.map((type) => [type, { label: t.leaveType[type], color: `var(--leave-${type.toLowerCase()})` }]),
      ) satisfies ChartConfig,
    [t],
  )
  const rtl = dir === 'rtl'

  const total = buckets.reduce((s, b) => s + Object.values(b.values).reduce((a, v) => a + v, 0), 0)
  if (total === 0) return <EmptyState description={t.chart.noApprovedDays} />

  // Only draw series that have data, in the fixed type order (colours never shift).
  const shown = (types ?? LEAVE_TYPES).filter((type) => buckets.some((b) => b.values[type] > 0))
  const rows = buckets.map((b) => ({ label: b.label, title: b.title, ...b.values }))
  const last = shown[shown.length - 1]

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart
        data={rows}
        margin={rtl ? { top: 8, right: -16, left: 4, bottom: 0 } : { top: 8, right: 4, left: -16, bottom: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        {/* In Arabic, time runs right → left and the value axis sits on the right. */}
        <XAxis
          dataKey="label"
          reversed={rtl}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={4}
          interval="preserveStartEnd"
        />
        <YAxis orientation={rtl ? 'right' : 'left'} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<DaysTooltip />} />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        {shown.map((type) => (
          <Bar
            key={type}
            dataKey={type}
            stackId="days"
            fill={`var(--color-${type})`}
            stroke="var(--card)"
            strokeWidth={1}
            radius={type === last ? [4, 4, 0, 0] : 0}
            maxBarSize={48}
            animationDuration={300}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

type TooltipRow = { title?: string } & Partial<Record<LeaveType, number>>

/** Tooltip listing only the non-zero types (in fixed order) plus the bucket total. */
function DaysTooltip({ active, payload }: { active?: boolean; payload?: { payload?: TooltipRow }[] }) {
  const { t } = useI18n()
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  const items = LEAVE_TYPES.map((type) => [type, row[type] ?? 0] as const).filter(([, v]) => v > 0)
  const total = items.reduce((s, [, v]) => s + v, 0)
  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{row.title}</p>
      {items.length === 0 && <p className="text-muted-foreground">{t.chart.noApprovedLeave}</p>}
      {items.map(([type, v]) => (
        <div key={type} className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: `var(--leave-${type.toLowerCase()})` }} />
          <span className="text-muted-foreground">{t.leaveType[type]}</span>
          <span className="ms-auto ps-3 font-medium tabular-nums">{t.units.days(v, formatDays(v))}</span>
        </div>
      ))}
      {items.length > 1 && (
        <div className="flex items-center gap-2 border-t pt-1.5 font-medium">
          <span>{t.common.total}</span>
          <span className="ms-auto ps-3 tabular-nums">{t.units.days(total, formatDays(total))}</span>
        </div>
      )}
    </div>
  )
}
