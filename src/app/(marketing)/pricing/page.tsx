import { cookies } from 'next/headers'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function PricingPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const isHe = locale === 'he'

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{isHe ? 'עמלות ותמחור' : 'Simple, transparent pricing'}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {isHe ? 'ללא עמלות נסתרות. משלמים רק על הזמנות שמתאשרות.' : 'No hidden fees. You only pay when a booking is confirmed.'}
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isHe ? 'לשוכרים' : 'For renters'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-4xl font-bold">15% <span className="text-lg font-normal text-muted-foreground">{isHe ? 'דמי שירות' : 'service fee'}</span></p>
            <p className="text-muted-foreground">
              {isHe
                ? 'עמלת שירות של 15% מתווספת לסכום ההזמנה. עדיין נמוך מהמתחרים הגלובליים (20%).'
                : 'A 15% service fee is added to each booking. Still lower than global competitors (20%).'}
            </p>
            <ul className="flex flex-col gap-2 pt-2">
              {(isHe
                ? ['תשלום מאובטח', 'חיוב רק לאחר אישור', 'ביטול גמיש לפי מדיניות המארח']
                : ['Secure payment', 'Charged only after host confirms', 'Flexible cancellation per host policy']
              ).map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>{isHe ? 'למארחים' : 'For hosts'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-4xl font-bold">0% <span className="text-lg font-normal text-muted-foreground">{isHe ? 'דמי פרסום' : 'listing fee'}</span></p>
            <p className="text-muted-foreground">
              {isHe
                ? 'פרסום מקום הוא חינמי לחלוטין. אנחנו מרוויחים רק כשאתם מרוויחים.'
                : 'Listing your space is completely free. We only earn when you earn.'}
            </p>
            <ul className="flex flex-col gap-2 pt-2">
              {(isHe
                ? ['ניהול הזמנות בקלות', 'תשלומים אוטומטיים דרך Stripe', 'כלי ניתוח ותובנות']
                : ['Easy booking management', 'Automatic payouts via Stripe', 'Analytics and insights']
              ).map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
