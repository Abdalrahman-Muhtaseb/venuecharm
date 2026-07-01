'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export interface EarningPoint {
  date: string   // ISO string — created_at of the payment
  value: number
}

interface PayoutsChartProps {
  earningsItems: EarningPoint[]  // host_payout_amount (base price)
  grossItems: EarningPoint[]     // amount + platform_fee_amount (what renter paid)
  locale: Locale
}

type DataMode = 'earnings' | 'gross'
type Period   = '1W' | '1M' | '3M' | '6M' | '1Y'

const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: '1W',  label: '1W',  days: 7   },
  { key: '1M',  label: '1M',  days: 30  },
  { key: '3M',  label: '3M',  days: 90  },
  { key: '6M',  label: '6M',  days: 180 },
  { key: '1Y',  label: '1Y',  days: 365 },
]

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function buildBuckets(items: EarningPoint[], days: number) {
  const map = new Map<string, number>()
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    map.set(toDateStr(d), 0)
  }
  for (const { date, value } of items) {
    const k = toDateStr(new Date(date))
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + value)
  }
  return [...map.entries()].map(([day, value]) => ({ day, value }))
}

function xLabel(dayStr: string, days: number): string {
  const d = new Date(dayStr + 'T00:00:00')
  if (days <= 30) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fullLabel(dayStr: string): string {
  const d = new Date(dayStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function makeTooltip(locale: Locale) {
  return function ChartTooltip({ active, payload }: {
    active?: boolean
    payload?: { value?: number; payload?: { day?: string } }[]
  }) {
    if (!active || !payload?.length) return null
    const value = payload[0]?.value ?? 0
    const day = payload[0]?.payload?.day ?? ''
    return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-lg text-sm">
        <p className="font-medium">{day ? fullLabel(day) : ''}</p>
        <p className="tabular-nums text-primary">{formatCurrencyILS(value, locale)}</p>
      </div>
    )
  }
}

export function PayoutsChart({ earningsItems, grossItems, locale }: PayoutsChartProps) {
  const isHe = locale === 'he'
  const [period, setPeriod] = useState<Period>('1M')
  const [mode,   setMode]   = useState<DataMode>('earnings')

  const days         = PERIODS.find((p) => p.key === period)?.days ?? 30
  const activeItems  = mode === 'gross' ? grossItems : earningsItems
  const data         = useMemo(() => buildBuckets(activeItems, days), [activeItems, days])
  const tickInterval = data.length > 20 ? Math.max(1, Math.floor(data.length / 8) - 1) : 0
  const TooltipContent = makeTooltip(locale)

  const pillClass = (active: boolean) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div>
      {/* Controls row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Mode toggle */}
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          <button type="button" onClick={() => setMode('earnings')} className={pillClass(mode === 'earnings')}>
            {isHe ? 'הכנסות נטו' : 'My earnings'}
          </button>
          <button type="button" onClick={() => setMode('gross')} className={pillClass(mode === 'gross')}>
            {isHe ? 'הכנסות ברוטו' : 'Gross revenue'}
          </button>
        </div>

        {/* Period toggle */}
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={pillClass(period === p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="payoutsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
            tickFormatter={(v) => xLabel(v, days)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={55}
            tickFormatter={(v) => (v === 0 ? '0' : `₪${(v / 1000).toFixed(0)}k`)}
          />
          <Tooltip content={<TooltipContent />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#payoutsGradient)"
            dot={false}
            activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
