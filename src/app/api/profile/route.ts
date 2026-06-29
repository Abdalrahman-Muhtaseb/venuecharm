import { createClient } from '@/lib/supabase/server'
import { normalizeILPhone } from '@/lib/phone'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, phone_number, bio, birth_date } = body

    // Validate input
    if (!first_name || !last_name) {
      return NextResponse.json(
        { message: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const phoneRaw = phone_number?.trim()
    let phone: string | null = null
    if (phoneRaw) {
      phone = normalizeILPhone(phoneRaw)
      if (!phone) {
        return NextResponse.json({ message: 'Invalid Israeli phone number' }, { status: 400 })
      }
    }

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone_number: phone,
        bio: bio?.trim() || null,
        birth_date: birth_date?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { message: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
