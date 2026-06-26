import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { ConversationList, type ConversationSummary } from '@/components/messaging/ConversationList'
import { MessagesPanes } from '@/components/messaging/MessagesPanes'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

type UserRow = { id: string; first_name: string | null; last_name: string | null; email: string }

function displayName(u: UserRow | undefined, fallback: string): string {
  if (!u) return fallback
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return name || u.email || fallback
}

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
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

  // Most recently active first: by last message time, falling back to when the
  // conversation was created.
  const sortTime = (c: (typeof conversations)[number]) =>
    new Date(lastMessage.get(c.id)?.created_at ?? c.created_at).getTime()
  const sorted = [...conversations].sort((a, b) => sortTime(b) - sortTime(a))

  const summaries: ConversationSummary[] = sorted.map((c) => {
    const otherId = c.renter_id === user.id ? c.host_id : c.renter_id
    const name = displayName(userMap.get(otherId), t.unknownUser)
    const last = lastMessage.get(c.id)
    return {
      id: c.id,
      name,
      venueTitle: c.venue_id ? (venueMap.get(c.venue_id) ?? null) : null,
      lastContent: last?.content ?? null,
      lastAt: last?.created_at ?? null,
      unread: unreadCount.get(c.id) ?? 0,
      initials: name.slice(0, 2).toUpperCase(),
    }
  })

  return (
    <div className="flex h-[100dvh] flex-col">
      <PublicNavbar locale={locale} />
      <MessagesPanes
        list={
          <ConversationList
            summaries={summaries}
            currentUserId={user.id}
            locale={locale}
            title={t.title}
            emptyText={t.inboxEmpty}
            emptyHint={t.inboxEmptyHint}
            aboutText={t.about}
          />
        }
      >
        {children}
      </MessagesPanes>
    </div>
  )
}
