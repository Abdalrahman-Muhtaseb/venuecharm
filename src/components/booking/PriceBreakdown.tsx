import { Separator } from '@/components/ui/separator'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'
import { COMMISSION_RATE } from '@/lib/stripe'

interface PriceBreakdownProps {
  subtotal: number
  locale: Locale
  className?: string
}

export function PriceBreakdown({ subtotal, locale, className }: PriceBreakdownProps) {
  const fee   = subtotal * COMMISSION_RATE
  const total = subtotal + fee
  const fmt   = (v: number) => formatCurrencyILS(v, locale)
  const isHe  = locale === 'he'

  return (
    <div className={`flex flex-col gap-2 text-sm ${className ?? ''}`}>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{isHe ? 'מחיר בסיס' : 'Subtotal'}</span>
        <span>{fmt(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {isHe ? `עמלת שירות (${COMMISSION_RATE * 100}%)` : `Service fee (${COMMISSION_RATE * 100}%)`}
        </span>
        <span>{fmt(fee)}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>{isHe ? 'סה"כ לתשלום' : 'Total'}</span>
        <span className="text-primary">{fmt(total)}</span>
      </div>
    </div>
  )
}
