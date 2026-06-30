import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ConnectOnboardingCard } from '@/components/stripe/ConnectOnboardingCard'
import { Button } from '@/components/ui/button'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function HostOnboardingPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: u } = await supabase
    .from('users')
    .select('first_name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
    .eq('id', user.id)
    .single()

  const profileDone = !!u?.first_name
  const chargesEnabled = !!u?.stripe_charges_enabled
  const payoutsEnabled = !!u?.stripe_payouts_enabled
  const detailsSubmitted = !!u?.stripe_details_submitted
  const stripeState: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' =
    chargesEnabled && payoutsEnabled ? 'COMPLETE' : u?.stripe_account_id ? 'IN_PROGRESS' : 'NOT_STARTED'

  const StepHeader = ({ done, n, title }: { done: boolean; n: number; title: string }) => (
    <div className="mb-3 flex items-center gap-3">
      {done ? (
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
      ) : (
        <Circle className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <h2 className="text-lg font-semibold">
        <span className="text-muted-foreground">{n}.</span> {title}
      </h2>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {isHe ? 'הפיכה למארח' : 'Become a host'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{isHe ? 'כמעט שם' : 'Almost there'}</h1>
        <p className="mt-2 text-muted-foreground">
          {isHe
            ? 'השלם את השלבים הבאים כדי להתחיל לפרסם את המקום שלך.'
            : 'Complete these steps to start listing your space.'}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Step 1 — profile */}
        <section>
          <StepHeader done={profileDone} n={1} title={isHe ? 'השלם את הפרופיל' : 'Complete your profile'} />
          <div className="ms-9">
            <Button asChild variant="outline">
              <Link href="/profile">
                {profileDone ? (isHe ? 'עריכת פרופיל' : 'Edit profile') : (isHe ? 'הוסף פרטים' : 'Add your details')}
              </Link>
            </Button>
          </div>
        </section>

        {/* Step 2 — Stripe (required) */}
        <section>
          <StepHeader done={stripeState === 'COMPLETE'} n={2} title={isHe ? 'חיבור חשבון תשלומים' : 'Connect payments'} />
          <div className="ms-9">
            <ConnectOnboardingCard
              locale={locale}
              state={stripeState}
              chargesEnabled={chargesEnabled}
              payoutsEnabled={payoutsEnabled}
              detailsSubmitted={detailsSubmitted}
            />
          </div>
        </section>

        {/* Step 3 — first listing (gated on Stripe) */}
        <section>
          <StepHeader done={false} n={3} title={isHe ? 'פרסם מקום ראשון' : 'Create your first listing'} />
          <div className="ms-9">
            {chargesEnabled ? (
              <Button asChild>
                <Link href="/listings/new">{isHe ? 'פרסם מקום' : 'Create listing'}</Link>
              </Button>
            ) : (
              <Button disabled variant="outline">
                <Lock className="me-2 h-4 w-4" aria-hidden="true" />
                {isHe ? 'יש לחבר תשלומים תחילה' : 'Connect payments first'}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
