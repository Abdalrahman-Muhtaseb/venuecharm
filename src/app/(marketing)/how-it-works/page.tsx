import { cookies } from 'next/headers'
import { Search, CalendarCheck, CreditCard } from 'lucide-react'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function HowItWorksPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const steps =
    locale === 'he'
      ? [
          { icon: Search, title: 'חפש מקום', body: 'סנן לפי תאריך, מיקום, קיבולת ותקציב. קבל תוצאות בפחות משתי שניות.' },
          { icon: CalendarCheck, title: 'שלח בקשה', body: 'בחר תאריך ושעות, שלח הודעה למארח וקבל אישור מהיר.' },
          { icon: CreditCard, title: 'שלם בבטחה', body: 'תשלום מאובטח עם Stripe. החיוב מתבצע רק לאחר אישור המארח.' },
        ]
      : [
          { icon: Search, title: 'Search venues', body: 'Filter by date, location, capacity, and budget. Results in under 2 seconds.' },
          { icon: CalendarCheck, title: 'Send a request', body: 'Pick your date and hours, message the host, and get quick confirmation.' },
          { icon: CreditCard, title: 'Pay securely', body: 'Secure payment via Stripe. Your card is only charged after the host confirms.' },
        ]

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{locale === 'he' ? 'איך זה עובד' : 'How it works'}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {locale === 'he' ? 'שלושה שלבים פשוטים מהחיפוש ועד לאישור' : 'Three simple steps from search to confirmed booking'}
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <div key={i} className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {locale === 'he' ? `שלב ${i + 1}` : `Step ${i + 1}`}
              </p>
              <h2 className="mt-2 text-xl font-bold">{title}</h2>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
