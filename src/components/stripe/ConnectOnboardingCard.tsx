'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { startStripeOnboarding, refreshStripeStatus } from '@/actions/stripe-connect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDictionary, type Locale } from '@/lib/i18n'

type OnboardingState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'

interface ConnectOnboardingCardProps {
  locale: Locale
  state: OnboardingState
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

export function ConnectOnboardingCard({
  locale,
  state,
  chargesEnabled,
  payoutsEnabled,
  detailsSubmitted,
}: ConnectOnboardingCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, startRefresh] = useTransition()
  const router = useRouter()
  const t = getDictionary(locale).stripeConnect

  const handleOnboard = () => {
    startTransition(async () => {
      try {
        toast(t.onboardingStarted)
        const { url } = await startStripeOnboarding()
        window.location.href = url
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.onboardingFailed)
      }
    })
  }

  const handleRefresh = () => {
    startRefresh(async () => {
      try {
        await refreshStripeStatus()
        toast.success(t.refreshed)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.onboardingFailed)
      }
    })
  }

  const titleLabel =
    state === 'COMPLETE' ? t.complete : state === 'IN_PROGRESS' ? t.inProgress : t.notStarted

  const description =
    state === 'COMPLETE'
      ? t.explainComplete
      : state === 'IN_PROGRESS'
      ? t.explainInProgress
      : t.explainNotStarted

  const Icon = state === 'COMPLETE' ? CheckCircle2 : AlertCircle
  const iconClass = state === 'COMPLETE' ? 'text-emerald-600' : 'text-amber-600'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 shrink-0 ${iconClass}`} />
            <div>
              <CardTitle>{titleLabel}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {state === 'COMPLETE' && (
          <div className="flex flex-wrap gap-2">
            {chargesEnabled && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                {t.chargesEnabled}
              </Badge>
            )}
            {payoutsEnabled && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                {t.payoutsEnabled}
              </Badge>
            )}
            {detailsSubmitted && (
              <Badge variant="outline">{t.detailsSubmitted}</Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {state !== 'COMPLETE' && (
            <Button onClick={handleOnboard} disabled={isPending}>
              {isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="me-2 h-4 w-4" />
              )}
              {state === 'NOT_STARTED' ? t.connectNow : t.continueOnboarding}
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" />
            )}
            {t.refresh}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
