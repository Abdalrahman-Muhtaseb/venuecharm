'use client'

import { useTransition, useState } from 'react'
import { RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminBackfillTestPaymentIds } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function BackfillPaymentsPanel() {
  const [isPending, startTransition] = useTransition()
  const [lastResult, setLastResult] = useState<{ transferred: number; refunds: number } | null>(null)

  const handleBackfill = () => {
    startTransition(async () => {
      try {
        const result = await adminBackfillTestPaymentIds()
        setLastResult(result)
        toast.success(
          `Done — ${result.transferred} transfer IDs set, ${result.refunds} refund IDs fetched from Stripe.`,
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Backfill failed')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Backfill Stripe Payment IDs</CardTitle>
        <CardDescription className="text-xs">
          Test mode only. Sets placeholder <code className="rounded bg-muted px-1 py-0.5">tr_test_*</code> transfer IDs
          for paid payments, and fetches real refund IDs from Stripe for refunded ones.
          Safe to run multiple times — only touches rows that are still <code className="rounded bg-muted px-1 py-0.5">NULL</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Button onClick={handleBackfill} disabled={isPending} variant="outline" size="sm">
          {isPending ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="me-2 h-4 w-4" />
          )}
          {isPending ? 'Running…' : 'Run backfill'}
        </Button>

        {lastResult && !isPending && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Last run: {lastResult.transferred} transferred, {lastResult.refunds} refund IDs updated
          </p>
        )}
      </CardContent>
    </Card>
  )
}
