import { uploadVenueImage } from '@/lib/cloudinary'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'HOST') {
      return NextResponse.json(
        { error: 'Only hosts can upload venue photos' },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('photo-0')
    const allFiles: File[] = []

    // Collect all files from formData
    let i = 0
    while (true) {
      const file = formData.get(`photo-${i}`)
      if (!file) break
      if (file instanceof File) {
        allFiles.push(file)
      }
      i++
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (allFiles.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 photos allowed' },
        { status: 400 },
      )
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    for (const file of allFiles) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}` },
          { status: 400 },
        )
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB max per file
        return NextResponse.json(
          { error: `File too large: ${file.name}` },
          { status: 400 },
        )
      }
    }

    // Use a temporary venue ID (user's ID + timestamp)
    // In production, this would be the actual venue ID after creation
    const tempVenueId = `temp-${user.id}-${Date.now()}`

    // Upload all files in parallel
    const uploadPromises = allFiles.map((file, idx) =>
      file.arrayBuffer().then((buffer) => uploadVenueImage(Buffer.from(buffer), tempVenueId, idx)),
    )

    const urls = await Promise.all(uploadPromises)

    return NextResponse.json({ urls }, { status: 200 })
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
