'use client'

import { useTransition } from 'react'
import { adminSeedVenues, adminSeedTestUsers } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Building2, Users, Plus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SeedDataPanelProps {
  testVenueCount?: number
  testUserCount?: number
}

function SeedCard({
  icon: Icon,
  iconCls,
  title,
  description,
  currentCount,
  currentLabel,
  buttonLabel,
  pendingLabel,
  onSeed,
  isPending,
}: {
  icon: React.ElementType
  iconCls: string
  title: string
  description: string
  currentCount: number
  currentLabel: string
  buttonLabel: string
  pendingLabel: string
  onSeed: () => void
  isPending: boolean
}) {
  const hasSeed = currentCount > 0
  return (
    <div className="rounded-xl border bg-background p-4 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconCls)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {hasSeed ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-emerald-600">
                    {currentCount} {currentLabel} already seeded
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Not seeded yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mb-4 text-xs text-muted-foreground leading-relaxed">{description}</p>

      <Button
        size="sm"
        variant={hasSeed ? 'outline' : 'default'}
        disabled={isPending}
        onClick={onSeed}
        className="w-full"
      >
        <Plus className="me-1.5 h-3.5 w-3.5" />
        {isPending ? pendingLabel : buttonLabel}
      </Button>
    </div>
  )
}

export function SeedDataPanel({ testVenueCount = 0, testUserCount = 0 }: SeedDataPanelProps) {
  const router = useRouter()
  const [pendingVenues, startVenues] = useTransition()
  const [pendingUsers,  startUsers]  = useTransition()

  const seedVenues = () =>
    startVenues(async () => {
      try {
        await adminSeedVenues()
        toast.success('5 test venues created — 3 pending approval, 2 active')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Seed failed')
      }
    })

  const seedUsers = () =>
    startUsers(async () => {
      try {
        await adminSeedTestUsers()
        toast.success('Test accounts ready — see description for credentials')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Seed failed')
      }
    })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SeedCard
        icon={Building2}
        iconCls="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
        title="Test Venues"
        description="Creates 5 realistic Israeli venues with real photos, operating hours, cancellation policies, and amenities. Prefixed with [TEST] so they can be cleaned up safely. 3 start as pending approval — go approve them in the Venues panel."
        currentCount={testVenueCount}
        currentLabel="[TEST] venues"
        buttonLabel="Seed 5 test venues"
        pendingLabel="Creating venues…"
        onSeed={seedVenues}
        isPending={pendingVenues}
      />

      <SeedCard
        icon={Users}
        iconCls="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
        title="Test Accounts"
        description={`Creates 3 demo accounts if they don't exist: 1 HOST (host.test@venuecharm.com) and 2 RENTERs (renter1/renter2.test@venuecharm.com). Password for all: VenueCharm2024!`}
        currentCount={testUserCount}
        currentLabel="test accounts"
        buttonLabel="Seed test accounts"
        pendingLabel="Creating accounts…"
        onSeed={seedUsers}
        isPending={pendingUsers}
      />
    </div>
  )
}
