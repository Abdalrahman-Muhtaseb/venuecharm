'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyBucket } from '@/lib/admin-analytics'
import { cn } from '@/lib/utils'

interface AdminUsersBarChartProps {
  all6M:   MonthlyBucket[]
  all12M:  MonthlyBucket[]
}

type Period = '6M' | '12M'

function shortMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

function UsersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
      <p className="mb-1 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground">New users:</span>
        <span className="font-medium">{payload[0].value}</span>
      </div>
    </div>
  )
}

export function AdminUsersBarChart({ all6M, all12M }: AdminUsersBarChartProps) {
  const [period, setPeriod] = useState<Period>('12M')

  const buckets = period === '6M' ? all6M : all12M
  const data = buckets.map((b) => ({
    month: shortMonth(b.month),
    users: b.value,
  }))

  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">New registrations</h2>
          <p className="text-xs text-muted-foreground">Users created per month</p>
        </div>
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

      <div dir="ltr">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
              allowDecimals={false}
              width={28}
            />
            <Tooltip content={<UsersTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
            <Bar
              dataKey="users"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
