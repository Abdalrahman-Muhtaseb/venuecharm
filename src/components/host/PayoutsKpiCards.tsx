'use client'

import { Info, ArrowUpRight, TrendingUp, Clock, Banknote } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'

interface PayoutsKpiCardsProps {
  grossRevenue: number
  totalEarned: number
  totalTransferred: number
  totalPending: number
  thisMonth: number
  locale: Locale
}

interface KpiCard {
  title: string
  value: number
  icon: typeof TrendingUp
  iconClass: string
  valueClass?: string
  tooltip: string
}

export function PayoutsKpiCards({
  grossRevenue,
  totalEarned,
  totalTransferred,
  totalPending,
  thisMonth,
  locale,
}: PayoutsKpiCardsProps) {
  const isHe = locale === 'he'
  const fmt = (v: number) => formatCurrencyILS(v, locale)

  const cards: KpiCard[] = [
    {
      title: isHe ? 'הכנסות ברוטו' : 'Gross revenue',
      value: grossRevenue,
      icon: Banknote,
      iconClass: 'text-muted-foreground',
      tooltip: isHe
        ? 'כולל עמלת 15% של VenueCharm שמשולמת על ידי השוכר בנוסף למחיר שקבעת'
        : 'Includes VenueCharm\'s 15% fee paid by the renter on top of your listed price',
    },
    {
      title: isHe ? 'הכנסות נטו' : 'Your earnings',
      value: totalEarned,
      icon: TrendingUp,
      iconClass: 'text-primary',
      tooltip: isHe
        ? 'מה שתקבל בפועל — המחיר שקבעת, לפני כל עמלה'
        : 'What you actually receive — your listed price before any fees',
    },
    {
      title: isHe ? 'הועבר לחשבון' : 'Transferred',
      value: totalTransferred,
      icon: ArrowUpRight,
      iconClass: 'text-emerald-600',
      valueClass: 'text-emerald-600',
      tooltip: isHe
        ? 'כסף שכבר הועבר לחשבון ה-Stripe שלך ומוכן למשיכה'
        : 'Already moved to your Stripe account and ready to withdraw',
    },
    {
      title: isHe ? 'ממתין להעברה' : 'Pending transfer',
      value: totalPending,
      icon: Clock,
      iconClass: 'text-amber-600',
      valueClass: 'text-amber-600',
      tooltip: isHe
        ? 'נגבה מהשוכר ומוחזק ב-Stripe — יועבר אוטומטית לפי לוח הזמנים שלך (2–7 ימי עסקים)'
        : 'Collected from the guest and held by Stripe — releases automatically on your payout schedule (2–7 business days)',
    },
    {
      title: isHe ? 'החודש' : 'This month',
      value: thisMonth,
      icon: TrendingUp,
      iconClass: 'text-primary',
      tooltip: isHe
        ? 'הכנסות נטו שנוצרו בחודש הקלנדרי הנוכחי'
        : 'Your net earnings in the current calendar month',
    },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <Card
            key={c.title}
            className={c.title.includes('Pending') || c.title.includes('ממתין') ? 'border-amber-200 dark:border-amber-900/50' : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {/* Title + info icon together on the start side */}
              <div className="flex items-center gap-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.title}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Info: ${c.title}`}
                      className="rounded-full text-muted-foreground/40 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Info className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs leading-relaxed">
                    {c.tooltip}
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* Card icon on the end side — no info clutter */}
              <c.icon className={`h-4 w-4 shrink-0 ${c.iconClass}`} aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold tabular-nums ${c.valueClass ?? ''}`}>
                {fmt(c.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  )
}
