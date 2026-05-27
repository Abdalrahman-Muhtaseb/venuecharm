import { NextResponse } from 'next/server'
import { refreshStripeStatus } from '@/actions/stripe-connect'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET() {
  try {
    await refreshStripeStatus()
  } catch {
    // If refresh fails (e.g. user not signed in), still redirect to payouts page
  }
  return NextResponse.redirect(new URL('/host/payouts', APP_URL))
}
