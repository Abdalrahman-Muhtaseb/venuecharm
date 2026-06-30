'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Two-pane chat shell: conversation list on the start side, active thread on
 * the end side. On mobile only one shows at a time — the list on /messages,
 * the thread on /messages/[id].
 */
export function MessagesPanes({ list, children }: { list: ReactNode; children: ReactNode }) {
  const pathname = usePathname()
  // Matches both /messages/<id> and /host/messages/<id> (list pages don't match).
  const hasActive = /\/messages\/[^/]+/.test(pathname)

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside
        className={cn(
          'w-full border-e md:w-80 md:shrink-0',
          hasActive ? 'hidden md:block' : 'block',
        )}
      >
        {list}
      </aside>
      <div className={cn('min-w-0 flex-1', hasActive ? 'block' : 'hidden md:block')}>
        {children}
      </div>
    </div>
  )
}
