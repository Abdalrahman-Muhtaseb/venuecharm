import { cookies } from 'next/headers'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: { bookingId?: string; payment_intent?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  // Mark payment as AUTHORIZED if Stripe redirected here with a payment_intent param
  if (searchParams.payment_intent) {
    const supabase = createClient()
    await supabase
      .from('payments')
      .update({ status: 'AUTHORIZED' })
      .eq('stripe_payment_intent_id', searchParams.payment_intent)
  }

  const isHe = locale === 'he'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">
          {isHe ? 'הבקשה נשלחה בהצלחה!' : 'Booking request sent!'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isHe
            ? 'תשלומך אושר. המארח יסקור את הבקשה ויאשר אותה בקרוב.'
            : 'Your payment is authorized. The host will review and confirm your request shortly.'}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">{isHe ? 'דף הבית' : 'Home'}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/venues">{isHe ? 'המשך לחפש' : 'Keep browsing'}</Link>
        </Button>
      </div>
    </div>
  )
}
