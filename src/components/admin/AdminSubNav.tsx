'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Venue Queue', href: '/admin' },
  { label: 'Dev Tools', href: '/admin/dev' },
]

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-muted/40">
      <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
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
    </div>
  )
}
