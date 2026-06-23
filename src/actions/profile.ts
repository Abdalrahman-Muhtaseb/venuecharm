'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadAvatarImage } from '@/lib/cloudinary'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: boolean; message?: string }

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()
  const phone = String(formData.get('phone_number') ?? '').trim()

  if (!firstName || !lastName) {
    return { success: false, message: 'First and last name are required.' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone_number: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function updateEmail(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Enter a valid email address.' }
  }
  if (email === user.email) {
    return { success: false, message: 'That is already your email.' }
  }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { success: false, message: error.message }

  return { success: true }
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' }
  }
  if (password !== confirm) {
    return { success: false, message: 'Passwords do not match.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { success: false, message: error.message }

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
