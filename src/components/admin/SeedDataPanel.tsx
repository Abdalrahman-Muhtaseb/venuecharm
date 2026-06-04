'use client'

import { useTransition } from 'react'
import { adminSeedVenues, adminSeedTestUsers } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'
import { toast } from 'sonner'

export function SeedDataPanel() {
  const [pendingVenues, startVenues] = useTransition()
  const [pendingUsers, startUsers] = useTransition()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Test Venues</CardTitle>
          </div>
          <CardDescription>
            Creates 5 realistic test venues in Israeli cities with [TEST] prefix — 3 pending approval, 2 active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            disabled={pendingVenues}
            onClick={() =>
              startVenues(async () => {
                try {
                  await adminSeedVenues()
                  toast.success('5 test venues created')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Seed failed')
                }
              })
            }
          >
            {pendingVenues ? 'Creating...' : 'Create 5 test venues'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Test Users</CardTitle>
          </div>
          <CardDescription>
            Creates 3 test accounts: 1 HOST + 2 RENTERs. Password: <code className="rounded bg-muted px-1">VenueCharm2024!</code>. Skips if emails already exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            disabled={pendingUsers}
            onClick={() =>
              startUsers(async () => {
                try {
                  await adminSeedTestUsers()
                  toast.success('Test users created (or already exist)')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Seed failed')
                }
              })
            }
          >
            {pendingUsers ? 'Creating...' : 'Create test users'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
