import { NextResponse } from 'next/server'
import { startStripeOnboarding } from '@/actions/stripe-connect'

export async function POST() {
  try {
    const { url } = await startStripeOnboarding()
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onboarding failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
