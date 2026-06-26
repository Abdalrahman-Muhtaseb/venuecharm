import type { MonthlyBucket } from '@/lib/admin-analytics'

function monthLabel(monthKey: string, opts: Intl.DateTimeFormatOptions): string {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', opts)
}

interface MonthlyBarChartProps {
  buckets: MonthlyBucket[]
  formatValue?: (v: number) => string
  barClassName?: string
}

/**
 * Dependency-free vertical bar chart for a 12-month series. Server-rendered
 * (no interactivity beyond the native hover tooltip). `dir="ltr"` keeps months
 * in chronological order even inside the RTL layout.
 */
export function MonthlyBarChart({
  buckets,
  formatValue = (v) => String(v),
  barClassName = 'bg-primary',
}: MonthlyBarChartProps) {
  const max = Math.max(...buckets.map((b) => b.value), 1)

  return (
    <div dir="ltr" className="flex h-44 w-full items-end gap-1.5">
      {buckets.map((b) => {
        const pct = (b.value / max) * 100
        const full = monthLabel(b.month, { month: 'long', year: 'numeric' })
        return (
          <div key={b.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end" title={`${full}: ${formatValue(b.value)}`}>
              <div
                className={`w-full rounded-t transition-all ${barClassName}`}
                style={{ height: `${pct}%`, minHeight: b.value > 0 ? '4px' : '0px' }}
              />
            </div>
            <span className="text-[10px] leading-none text-muted-foreground">
              {monthLabel(b.month, { month: 'short' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
