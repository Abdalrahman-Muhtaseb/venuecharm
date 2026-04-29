import Link from 'next/link'
import { Clock, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'

interface BookingWidgetProps {
  venueId: string
  pricePerHour: number | null
  pricePerDay: number | null
  isOwner: boolean
  isActive: boolean
  locale: Locale
}

export function BookingWidget({
  venueId,
  pricePerHour,
  pricePerDay,
  isOwner,
  isActive,
  locale,
}: BookingWidgetProps) {
  const isHe = locale === 'he'
  const fmt = (v: number) => formatCurrencyILS(v, locale)

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {isHe ? 'הזמנת מקום' : 'Book this venue'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Pricing */}
        <div className="flex flex-col gap-2">
          {pricePerHour != null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {isHe ? 'לשעה' : 'Per hour'}
              </span>
              <span className="text-lg font-bold text-primary">{fmt(Number(pricePerHour))}</span>
            </div>
          )}
          {pricePerDay != null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {isHe ? 'ליום' : 'Per day'}
              </span>
              <span className="text-lg font-bold text-primary">{fmt(Number(pricePerDay))}</span>
            </div>
          )}
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          {isHe
            ? 'עמלת שירות של 15% מתווספת בשלב הסיום.'
            : 'A 15% service fee is added at checkout.'}
        </p>

        {isOwner ? (
          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href={`/listings/${venueId}/edit`}>
                {isHe ? 'עריכת נכס' : 'Edit listing'}
              </Link>
            </Button>
          </div>
        ) : isActive ? (
          <Button asChild className="w-full" size="lg">
            <Link href={`/venues/${venueId}/book`}>
              {isHe ? 'הזמן עכשיו' : 'Book now'}
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-full">
            {isHe ? 'לא זמין להזמנה' : 'Not available'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
