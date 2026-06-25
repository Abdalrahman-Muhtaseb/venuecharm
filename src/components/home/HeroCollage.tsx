'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { BLUR_DATA_URL } from '@/lib/image'

interface RotatingPanelProps {
  srcs: string[]
  className: string
  sizes: string
  priority?: boolean
  intervalMs: number
  delayMs: number
}

/** A single collage panel that crossfades through its image list on a timer. */
function RotatingPanel({ srcs, className, sizes, priority, intervalMs, delayMs }: RotatingPanelProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (srcs.length <= 1) return
    let interval: ReturnType<typeof setInterval>
    const start = setTimeout(() => {
      interval = setInterval(() => setIdx((i) => (i + 1) % srcs.length), intervalMs)
    }, delayMs)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [srcs.length, intervalMs, delayMs])

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-muted ${className}`}>
      {srcs.map((src, i) => (
        <Image
          key={`${i}-${src}`}
          src={src}
          alt=""
          fill
          priority={priority && i === 0}
          sizes={sizes}
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      ))}
    </div>
  )
}

/** Rotate an array so it starts at `offset` (keeps every panel out of sync). */
function rotate<T>(arr: T[], offset: number): T[] {
  if (arr.length === 0) return arr
  const o = offset % arr.length
  return [...arr.slice(o), ...arr.slice(0, o)]
}

/**
 * Hero collage with three auto-rotating photo panels. Each panel cycles through
 * the same pool but starts at a different image and on a staggered timer, so
 * they crossfade independently rather than all flipping at once.
 */
export function HeroCollage({ photos }: { photos: string[] }) {
  const pool = photos.length > 0 ? photos : []
  const sizes = '(min-width: 1024px) 25vw, 0px'

  return (
    <div className="relative hidden lg:block">
      <div className="grid grid-cols-2 grid-rows-2 gap-4">
        <RotatingPanel
          srcs={rotate(pool, 0)}
          className="row-span-2 h-[520px]"
          sizes={sizes}
          priority
          intervalMs={5000}
          delayMs={0}
        />
        <RotatingPanel
          srcs={rotate(pool, 1)}
          className="h-[252px]"
          sizes={sizes}
          intervalMs={5000}
          delayMs={1600}
        />
        <RotatingPanel
          srcs={rotate(pool, 2)}
          className="h-[252px]"
          sizes={sizes}
          intervalMs={5000}
          delayMs={3200}
        />
      </div>
    </div>
  )
}
