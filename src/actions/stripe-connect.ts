'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createConnectAccount,
  createOnboardingLink,
  fetchConnectStatus,
} from '@/lib/stripe-connect'

async function requireHost() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, email, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'HOST') {
    throw new Error('Only hosts can manage payouts.')
  }
  return { user, profile, supabase }
}

export async function startStripeOnboarding(): Promise<{ url: string }> {
  const { user, profile } = await requireHost()
  const admin = createAdminClient()

  let accountId = profile.stripe_account_id
  if (!accountId) {
    const account = await createConnectAccount(profile.email!, user.id)
    accountId = account.id
    await admin.from('users').update({ stripe_account_id: accountId }).eq('id', user.id)
  }

  const link = await createOnboardingLink(accountId)
  return { url: link.url }
}

export async function refreshStripeStatus() {
  const { user, profile } = await requireHost()
  if (!profile.stripe_account_id) return

  const status = await fetchConnectStatus(profile.stripe_account_id)
  const admin = createAdminClient()
  await admin
    .from('users')
    .update({
      stripe_charges_enabled: status.charges_enabled,
      stripe_payouts_enabled: status.payouts_enabled,
      stripe_details_submitted: status.details_submitted,
    })
    .eq('id', user.id)

  revalidatePath('/host/payouts')
  revalidatePath('/host/listings/new')
  revalidatePath('/host/dashboard')
}
