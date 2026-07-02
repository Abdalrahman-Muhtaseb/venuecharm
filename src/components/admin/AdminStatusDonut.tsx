'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { StatusBreakdown } from '@/lib/admin-analytics'

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: '#f59e0b',
  CONFIRMED:        '#10b981',
  COMPLETED:        '#3b82f6',
  CANCELLED:        '#94a3b8',
  REJECTED:         '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Pending',
  CONFIRMED:        'Confirmed',
  COMPLETED:        'Completed',
  CANCELLED:        'Cancelled',
  REJECTED:         'Rejected',
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: p.payload.fill }} />
        <span className="font-medium">{STATUS_LABELS[p.name] ?? p.name}</span>
        <span className="text-muted-foreground">{p.value}</span>
        <span className="text-muted-foreground">({((p.payload.percent ?? 0) * 100).toFixed(1)}%)</span>
      </div>
    </div>
  )
}

function CustomLegend({ data }: { data: StatusBreakdown[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="flex flex-col gap-2 ps-2">
      {data.map((d) => (
        <div key={d.status} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: STATUS_COLORS[d.status] ?? '#94a3b8' }}
            />
            <span className="text-muted-foreground">{STATUS_LABELS[d.status] ?? d.status}</span>
          </div>
          <div className="flex items-center gap-1.5 tabular-nums">
            <span className="font-medium">{d.count}</span>
            <span className="text-muted-foreground">
              ({total > 0 ? ((d.count / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminStatusDonut({ data }: { data: StatusBreakdown[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="rounded-xl border bg-background p-5">
      <h2 className="mb-1 text-sm font-semibold">Booking status breakdown</h2>
      <p className="mb-4 text-xs text-muted-foreground">All {total} bookings by status</p>

      <div dir="ltr" className="flex items-center gap-4">
        <div className="relative flex-none">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                dataKey="count"
                nameKey="status"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((d) => (
                  <Cell
                    key={d.status}
                    fill={STATUS_COLORS[d.status] ?? '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* centre label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums">{total}</span>
            <span className="text-[10px] text-muted-foreground">total</span>
          </div>
        </div>

        <CustomLegend data={data} />
      </div>
    </div>
  )
}
