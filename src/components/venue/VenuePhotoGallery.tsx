'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BLUR_DATA_URL } from '@/lib/image'
import type { Locale } from '@/lib/i18n'

interface VenuePhotoGalleryProps {
  photos: string[]
  title: string
  locale: Locale
}

export function VenuePhotoGallery({ photos, title, locale }: VenuePhotoGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-muted">
        <p className="text-muted-foreground">
          {locale === 'he' ? 'אין תמונות זמינות' : 'No photos available'}
        </p>
      </div>
    )
  }

  const prev = () => setLightboxIdx((i) => (i == null ? null : (i - 1 + photos.length) % photos.length))
  const next = () => setLightboxIdx((i) => (i == null ? null : (i + 1) % photos.length))

  return (
    <>
      {/* Gallery grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl" style={{ height: '420px' }}>
        {/* Main photo */}
        <div
          className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden"
          onClick={() => setLightboxIdx(0)}
        >
          <Image src={photos[0]} alt={title} fill className="object-cover transition hover:scale-105" priority sizes="50vw" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
        </div>

        {/* Thumbnails (up to 4) */}
        {photos.slice(1, 5).map((photo, i) => (
          <div
            key={i}
            className="relative cursor-pointer overflow-hidden"
            onClick={() => setLightboxIdx(i + 1)}
          >
            <Image src={photo} alt={`${title} ${i + 2}`} fill className="object-cover transition hover:scale-105" sizes="25vw" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
            {/* +N overlay on the last visible thumbnail when there are more */}
            {i === 3 && photos.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-lg font-bold text-white">+{photos.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <button
            className="absolute start-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); prev() }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div
            className="relative mx-16 max-h-[85vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIdx]}
              alt={`${title} ${lightboxIdx + 1}`}
              width={1200}
              height={800}
              className="max-h-[85vh] w-full rounded-xl object-contain"
            />
            <p className="mt-2 text-center text-sm text-white/60">
              {lightboxIdx + 1} / {photos.length}
            </p>
          </div>
          <button
            className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); next() }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  )
}
