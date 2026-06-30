'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDateLocalized, type Locale } from '@/lib/i18n'

export interface ConversationSummary {
  id: string
  name: string
  venueTitle: string | null
  lastContent: string | null
  lastAt: string | null
  unread: number
  initials: string
}

interface ConversationListProps {
  summaries: ConversationSummary[]
  currentUserId: string
  locale: Locale
  title: string
  emptyText: string
  emptyHint: string
  aboutText: string
  /** Base path the thread links live under — `/messages` or `/host/messages`. */
  basePath?: string
}

export function ConversationList({
  summaries,
  currentUserId,
  locale,
  title,
  emptyText,
  emptyHint,
  aboutText,
  basePath = '/messages',
}: ConversationListProps) {
  const pathname = usePathname()
  const activeId = pathname.startsWith(`${basePath}/`)
    ? pathname.slice(basePath.length + 1).split('/')[0]
    : null

  const [items, setItems] = useState(summaries)
  // Re-seed from the server only on a real reload (the layout doesn't re-fetch
  // when switching conversations, so realtime keeps the list fresh meanwhile).
  useEffect(() => { setItems(summaries) }, [summaries])

  // Clear the unread badge for the conversation the user is currently viewing.
  const activeRef = useRef<string | null>(activeId)
  useEffect(() => {
    activeRef.current = activeId
    if (!activeId) return
    setItems((prev) => prev.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c)))
  }, [activeId])

  // Live updates: any new message bumps its conversation to the top, refreshes
  // the preview, and bumps the unread count (unless it's mine or already open).
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as { conversation_id: string; sender_id: string; content: string; created_at: string }
          setItems((prev) => {
            const idx = prev.findIndex((c) => c.id === m.conversation_id)
            if (idx === -1) return prev
            const fromOther = m.sender_id !== currentUserId
            const isOpen = m.conversation_id === activeRef.current
            const updated: ConversationSummary = {
              ...prev[idx],
              lastContent: m.content,
              lastAt: m.created_at,
              unread: fromOther && !isOpen ? prev[idx].unread + 1 : prev[idx].unread,
            }
            const next = prev.filter((_, i) => i !== idx)
            return [updated, ...next]
          })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-bold">{title}</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <MessageSquare className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">{emptyText}</p>
          <p className="text-xs text-muted-foreground">{emptyHint}</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {items.map((c) => {
            const active = pathname === `${basePath}/${c.id}`
            return (
              <li key={c.id}>
                <Link
                  href={`${basePath}/${c.id}`}
                  className={cn(
                    'flex items-center gap-3 border-b px-4 py-3 transition hover:bg-muted/50',
                    active && 'bg-muted',
                  )}
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {c.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('truncate', c.unread > 0 ? 'font-semibold' : 'font-medium')}>{c.name}</p>
                      {c.lastAt && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateLocalized(c.lastAt, locale)}
                        </span>
                      )}
                    </div>
                    {c.venueTitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {aboutText} {c.venueTitle}
                      </p>
                    )}
                    <p className={cn('mt-0.5 truncate text-sm', c.unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                      {c.lastContent ?? '—'}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="ms-2 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
