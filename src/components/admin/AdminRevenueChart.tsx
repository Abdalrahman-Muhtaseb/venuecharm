'use client'

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { MonthlyBucket } from '@/lib/admin-analytics'
import { formatCurrencyILS } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface AdminRevenueChartProps {
  gmv6M:   MonthlyBucket[]
  gmv12M:  MonthlyBucket[]
  cnt6M:   MonthlyBucket[]
  cnt12M:  MonthlyBucket[]
}

type Period = '6M' | '12M'
type Mode   = 'revenue' | 'bookings'

function shortMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

function buildData(gmv: MonthlyBucket[], cnt: MonthlyBucket[]) {
  return gmv.map((b, i) => ({
    month: shortMonth(b.month),
    gmv:   b.value,
    count: cnt[i]?.value ?? 0,
  }))
}

function ILSTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
      <p className="mb-1.5 font-medium">{label}</p>
      {(payload as any[]).map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {p.dataKey === 'gmv' ? formatCurrencyILS(p.value, 'en') : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AdminRevenueChart({ gmv6M, gmv12M, cnt6M, cnt12M }: AdminRevenueChartProps) {
  const [period, setPeriod] = useState<Period>('12M')
  const [mode, setMode]     = useState<Mode>('revenue')

  const data = buildData(
    period === '6M' ? gmv6M : gmv12M,
    period === '6M' ? cnt6M : cnt12M,
  )

  const isRevenue = mode === 'revenue'

  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            {isRevenue ? 'Revenue (GMV)' : 'Booking volume'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isRevenue
              ? 'Confirmed + completed bookings, by month'
              : 'Total bookings created per month'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {(['revenue', 'bookings'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  mode === m
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m === 'revenue' ? 'Revenue' : 'Bookings'}
              </button>
            ))}
          </div>

          {/* Period toggle */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {(['6M', '12M'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div dir="ltr">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={isRevenue
                ? (v: number) => v >= 1000 ? `₪${(v / 1000).toFixed(0)}k` : `₪${v}`
                : (v: number) => String(v)}
              width={isRevenue ? 52 : 32}
            />
            <Tooltip content={<ILSTooltip />} />
            {isRevenue ? (
              <Area
                type="monotone"
                dataKey="gmv"
                name="GMV"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#gradRevenue)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="count"
                name="Bookings"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradBookings)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
