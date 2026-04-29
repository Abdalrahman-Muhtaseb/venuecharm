'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/lib/i18n'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CheckoutFormProps {
  bookingId: string
  venueId: string
  locale: Locale
}

function CheckoutForm({ bookingId, venueId, locale }: CheckoutFormProps) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error, setError]       = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const isHe = locale === 'he'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsPending(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${appUrl}/venues/${venueId}/booking-confirmed?bookingId=${bookingId}`,
      },
    })

    // Only executes if redirect did not happen (i.e. on error)
    setError(stripeError.message ?? (isHe ? 'שגיאה בתשלום' : 'Payment failed'))
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!stripe || !elements || isPending} className="w-full">
        {isPending
          ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isHe ? 'מעבד...' : 'Processing...'}</>
          : isHe ? 'שלם עכשיו' : 'Pay now'
        }
      </Button>
    </form>
  )
}

interface StripePaymentFormProps {
  clientSecret: string
  bookingId: string
  venueId: string
  locale: Locale
}

export function StripePaymentForm({ clientSecret, bookingId, venueId, locale }: StripePaymentFormProps) {
  if (!stripePromise) return null

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: locale === 'he' ? 'he' : 'en' }}>
      <CheckoutForm bookingId={bookingId} venueId={venueId} locale={locale} />
    </Elements>
  )
}
