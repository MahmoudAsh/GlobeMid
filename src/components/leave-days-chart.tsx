import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { EmptyState } from '@/components/empty-state'
import { LEAVE_TYPES } from '@/lib/constants'
import { formatDays } from '@/lib/dates'
import type { ChartBucket } from '@/lib/stats'
import type { LeaveType } from '@/lib/types'

const config = Object.fromEntries(
  LEAVE_TYPES.map((t) => [t, { label: t, color: `var(--leave-${t.toLowerCase()})` }]),
) satisfies ChartConfig

/** Stacked bars of approved leave days per bucket, by leave type. */
export function LeaveDaysChart({ buckets, types }: { buckets: ChartBucket[]; types?: LeaveType[] }) {
  const total = buckets.reduce((s, b) => s + Object.values(b.values).reduce((a, v) => a + v, 0), 0)
  if (total === 0) return <EmptyState description="No approved leave days fall in this period." />

  // Only draw series that have data, in the fixed type order (colours never shift).
  const shown = (types ?? LEAVE_TYPES).filter((t) => buckets.some((b) => b.values[t] > 0))
  const rows = buckets.map((b) => ({ label: b.label, title: b.title, ...b.values }))
  const last = shown[shown.length - 1]

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={4}
          interval="preserveStartEnd"
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={44} />
        <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<DaysTooltip />} />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        {shown.map((t) => (
          <Bar
            key={t}
            dataKey={t}
            stackId="days"
            fill={`var(--color-${t})`}
            stroke="var(--card)"
            strokeWidth={1}
            radius={t === last ? [4, 4, 0, 0] : 0}
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
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  const items = LEAVE_TYPES.map((t) => [t, row[t] ?? 0] as const).filter(([, v]) => v > 0)
  const total = items.reduce((s, [, v]) => s + v, 0)
  const unit = (v: number) => (v === 1 ? 'day' : 'days')
  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{row.title}</p>
      {items.length === 0 && <p className="text-muted-foreground">No approved leave</p>}
      {items.map(([t, v]) => (
        <div key={t} className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: `var(--leave-${t.toLowerCase()})` }} />
          <span className="text-muted-foreground">{t}</span>
          <span className="ml-auto font-medium tabular-nums">
            {formatDays(v)} {unit(v)}
          </span>
        </div>
      ))}
      {items.length > 1 && (
        <div className="flex items-center gap-2 border-t pt-1.5 font-medium">
          <span>Total</span>
          <span className="ml-auto tabular-nums">
            {formatDays(total)} {unit(total)}
          </span>
        </div>
      )}
    </div>
  )
}
