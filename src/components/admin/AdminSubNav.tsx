'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Venue Queue', href: '/admin' },
  { label: 'Amenities', href: '/admin/amenities' },
  { label: 'Dev Tools', href: '/admin/dev' },
]

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-muted/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 px-4 sm:px-6">
        <div className="flex gap-1">
          {LINKS.map(({ label, href }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground',
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          Back to site
        </Link>
      </div>
    </div>
  )
}
