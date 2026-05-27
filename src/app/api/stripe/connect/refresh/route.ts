import { NextResponse } from 'next/server'
import { startStripeOnboarding } from '@/actions/stripe-connect'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET() {
  try {
    const { url } = await startStripeOnboarding()
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.redirect(new URL('/host/payouts', APP_URL))
  }
}
