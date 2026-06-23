/**
 * VenueCharm — Seed Image → Cloudinary Migration
 *
 * Moves externally-hosted venue photos (e.g. Unsplash hotlinks from the seed
 * script) into your own Cloudinary account and rewrites venues.photos to the
 * optimized Cloudinary delivery URLs (f_auto,q_auto).
 *
 * - Idempotent: photos already on res.cloudinary.com are left untouched.
 * - Deduplicated: each unique source URL is uploaded once and reused across
 *   every venue that references it.
 * - Non-destructive to local images: only http(s) URLs are migrated.
 *
 * Usage:
 *   npx tsx seeds/migrate-images-to-cloudinary.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌  Missing Cloudinary credentials (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const isCloudinary = (url: string) => url.includes('res.cloudinary.com')
const isRemote = (url: string) => /^https?:\/\//.test(url)

// Build a stable Cloudinary public_id from a source URL (e.g. Unsplash photo id).
function publicIdFor(url: string): string {
  const match = url.match(/photo-[\w-]+/)
  if (match) return match[0]
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\?.*$/, '')
    .replace(/[^\w]+/g, '-')
    .slice(0, 80)
}

async function uploadOnce(url: string, cache: Map<string, string>): Promise<string> {
  const cached = cache.get(url)
  if (cached) return cached

  const publicId = publicIdFor(url)
  // Cloudinary fetches the remote URL server-side — no local download needed.
  await cloudinary.uploader.upload(url, {
    folder: 'venuecharm/seed',
    public_id: publicId,
    overwrite: false,
    resource_type: 'image',
  })

  // Deliver with automatic format + quality, sized for the largest card/gallery use.
  const deliveryUrl = cloudinary.url(`venuecharm/seed/${publicId}`, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
    width: 1200,
    height: 800,
    crop: 'fill',
  })

  cache.set(url, deliveryUrl)
  return deliveryUrl
}

async function migrate() {
  console.log('🖼️   VenueCharm Image Migration → Cloudinary')
  console.log('════════════════════════════════════════')

  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, title, photos')

  if (error) {
    console.error('❌  Failed to load venues:', error.message)
    process.exit(1)
  }

  const rows = (venues ?? []) as { id: string; title: string; photos: string[] | null }[]
  console.log(`📦  Loaded ${rows.length} venues\n`)

  const uploadCache = new Map<string, string>()
  let venuesUpdated = 0
  let photosMigrated = 0
  let venuesSkipped = 0

  for (const venue of rows) {
    const photos = venue.photos ?? []
    if (photos.length === 0) {
      venuesSkipped++
      continue
    }

    let changed = false
    const newPhotos: string[] = []

    for (const url of photos) {
      if (!isRemote(url) || isCloudinary(url)) {
        newPhotos.push(url)
        continue
      }
      try {
        const migrated = await uploadOnce(url, uploadCache)
        newPhotos.push(migrated)
        changed = true
        photosMigrated++
      } catch (e) {
        console.error(`  ⚠️  ${venue.title}: failed to migrate ${url} — ${e instanceof Error ? e.message : e}`)
        newPhotos.push(url) // keep original on failure
      }
    }

    if (!changed) {
      venuesSkipped++
      continue
    }

    const { error: updateErr } = await supabase
      .from('venues')
      .update({ photos: newPhotos })
      .eq('id', venue.id)

    if (updateErr) {
      console.error(`  ❌  ${venue.title}: DB update failed — ${updateErr.message}`)
    } else {
      console.log(`  ✅  ${venue.title} (${newPhotos.length} photos)`)
      venuesUpdated++
    }
  }

  console.log('\n════════════════════════════════════════')
  console.log(`✅  Venues updated:   ${venuesUpdated}`)
  console.log(`🖼️   Photos migrated:  ${photosMigrated}`)
  console.log(`☁️   Unique uploads:   ${uploadCache.size}`)
  console.log(`⏭️   Venues skipped:   ${venuesSkipped} (already Cloudinary / no photos)`)
  console.log('════════════════════════════════════════\n')
}

migrate().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
