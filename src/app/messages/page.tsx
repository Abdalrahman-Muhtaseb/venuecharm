import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  defaultLocale,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

type UserRow = { id: string; first_name: string | null; last_name: string | null; email: string }

function displayName(u: UserRow | undefined, fallback: string): string {
  if (!u) return fallback
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return name || u.email || fallback
}

export default async function MessagesInboxPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).messages

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: convos } = await admin
    .from('conversations')
    .select('id, venue_id, booking_id, renter_id, host_id, created_at')
    .or(`renter_id.eq.${user.id},host_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const conversations = convos ?? []

  const otherIds = Array.from(
    new Set(conversations.map((c) => (c.renter_id === user.id ? c.host_id : c.renter_id))),
  )
  const venueIds = Array.from(
    new Set(conversations.map((c) => c.venue_id).filter((v): v is string => Boolean(v))),
  )
  const convoIds = conversations.map((c) => c.id)

  const [usersRes, venuesRes, messagesRes] = await Promise.all([
    otherIds.length
      ? admin.from('users').select('id, first_name, last_name, email').in('id', otherIds)
      : Promise.resolve({ data: [] as UserRow[] }),
    venueIds.length
      ? admin.from('venues').select('id, title').in('id', venueIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    convoIds.length
      ? admin
          .from('messages')
          .select('conversation_id, sender_id, content, created_at, is_read')
          .in('conversation_id', convoIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as { conversation_id: string; sender_id: string; content: string; created_at: string; is_read: boolean }[] }),
  ])

  const userMap = new Map((usersRes.data ?? []).map((u) => [u.id, u as UserRow]))
  const venueMap = new Map((venuesRes.data ?? []).map((v) => [v.id, v.title]))

  const lastMessage = new Map<string, { content: string; created_at: string }>()
  const unreadCount = new Map<string, number>()
  for (const m of messagesRes.data ?? []) {
    lastMessage.set(m.conversation_id, { content: m.content, created_at: m.created_at })
    if (!m.is_read && m.sender_id !== user.id) {
      unreadCount.set(m.conversation_id, (unreadCount.get(m.conversation_id) ?? 0) + 1)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold md:text-4xl">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      {conversations.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border bg-muted/20 px-6 py-16 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{t.inboxEmpty}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.inboxEmptyHint}</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {conversations.map((c) => {
            const otherId = c.renter_id === user.id ? c.host_id : c.renter_id
            const name = displayName(userMap.get(otherId), t.unknownUser)
            const venueTitle = c.venue_id ? venueMap.get(c.venue_id) : undefined
            const last = lastMessage.get(c.id)
            const unread = unreadCount.get(c.id) ?? 0
            const initials = name.slice(0, 2).toUpperCase()

            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-4 rounded-xl border bg-background p-4 transition hover:bg-muted/40"
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate ${unread > 0 ? 'font-semibold' : 'font-medium'}`}>{name}</p>
                      {last && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateLocalized(last.created_at, locale)}
                        </span>
                      )}
                    </div>
                    {venueTitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {t.about} {venueTitle}
                      </p>
                    )}
                    <p className={`mt-0.5 truncate text-sm ${unread > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {last?.content ?? '—'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="ms-2 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                      {unread}
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
