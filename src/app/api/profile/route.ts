import { createClient } from '@/lib/supabase/server'
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
    const { first_name, last_name, phone_number } = body

    // Validate input
    if (!first_name || !last_name) {
      return NextResponse.json(
        { message: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone_number: phone_number?.trim() || null,
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
