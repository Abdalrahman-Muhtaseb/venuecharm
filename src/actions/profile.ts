'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadAvatarImage } from '@/lib/cloudinary'
import { normalizeILPhone } from '@/lib/phone'
import { sendPasswordResetEmail, getEmailLocale } from '@/lib/email'
import { revalidatePath } from 'next/cache'

// `INVALID_PHONE` is a sentinel the client maps to a localized message.
type ActionResult = { success: boolean; message?: string }

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()
  const phoneRaw = String(formData.get('phone_number') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const birthDate = String(formData.get('birth_date') ?? '').trim()

  if (!firstName || !lastName) {
    return { success: false, message: 'First and last name are required.' }
  }

  let phone: string | null = null
  if (phoneRaw) {
    phone = normalizeILPhone(phoneRaw)
    if (!phone) return { success: false, message: 'INVALID_PHONE' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      bio: bio || null,
      birth_date: birthDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export interface ProfileVisibility {
  bio: boolean
  birthday: boolean
  reviews: boolean
}

/** Persists which fields are shown to others on public surfaces. Phone and email
 *  are intentionally not part of this — they're never public. */
export async function updateVisibility(vis: ProfileVisibility): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const visibility = {
    bio: !!vis.bio,
    birthday: !!vis.birthday,
    reviews: !!vis.reviews,
  }

  const { error } = await supabase
    .from('users')
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Sends a password-reset link to the signed-in user's email. The link lands on
 * /reset-password where they set a new password. The recovery link is generated
 * via the service-role admin API (captcha-exempt) and emailed through Resend, so
 * Supabase's global captcha protection stays scoped to login/signup only.
 */
export async function sendPasswordReset(): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, message: 'Unauthorized' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
    options: { redirectTo: `${appUrl}/reset-password` },
  })

  const link = data?.properties?.action_link
  if (error || !link) {
    return { success: false, message: error?.message ?? 'Failed to generate reset link.' }
  }

  await sendPasswordResetEmail({ to: user.email, resetUrl: link, locale: getEmailLocale() })
  return { success: true }
}

export async function updateAvatar(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const file = formData.get('avatar')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'No image provided.' }
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { success: false, message: 'Use a JPEG, PNG, or WebP image.' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: 'Image must be under 5MB.' }
  }

  let url: string
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    url = await uploadAvatarImage(buffer, user.id)
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Upload failed.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/profile')
  return { success: true, message: url }
}
