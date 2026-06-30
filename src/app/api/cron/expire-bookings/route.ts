import { NextRequest, NextResponse } from 'next/server'
import { expireOverdueBookings } from '@/lib/booking-expiry'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Auto-cancels PENDING bookings the host never responded to, releasing the held
 * Stripe authorization. Triggered by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer <CRON_SECRET>`. Rejects anything else.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expireOverdueBookings()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to expire bookings' },
      { status: 500 },
    )
  }
}
