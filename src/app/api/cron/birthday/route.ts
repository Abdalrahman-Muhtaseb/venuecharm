import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBirthdayEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface BirthdayRow {
  id: string
  email: string | null
  first_name: string | null
}

/**
 * Daily birthday emailer. Triggered by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer <CRON_SECRET>`. Sends in the product default locale
 * (Hebrew) — there is no per-user locale stored, and no request cookie in cron.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('users_with_birthday_today')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const recipients = ((data ?? []) as BirthdayRow[]).filter(
    (u): u is BirthdayRow & { email: string } => Boolean(u.email),
  )

  await Promise.all(
    recipients.map((u) => sendBirthdayEmail({ to: u.email, name: u.first_name })),
  )

  return NextResponse.json({ sent: recipients.length })
}
