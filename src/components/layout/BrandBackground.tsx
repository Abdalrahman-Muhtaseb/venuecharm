import { cn } from '@/lib/utils'

interface BrandBackgroundProps {
  className?: string
}

/**
 * Subtle, theme-aware branded backdrop: soft purple radial washes + a couple of
 * blurred primary-colored blobs. Decorative only — render it as the first child of
 * a `relative` container (it is absolutely positioned and non-interactive).
 */
export function BrandBackground({ className }: BrandBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_-10%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(120%_80%_at_95%_10%,hsl(var(--primary)/0.10),transparent_55%)]" />
      {/* Blurred blobs */}
      <div className="absolute -start-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute end-[-6rem] top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-8rem] start-1/3 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
    </div>
  )
}
