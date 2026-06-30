import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ConversationSummary } from '@/components/messaging/ConversationList'

type UserRow = { id: string; first_name: string | null; last_name: string | null; email: string }

function displayName(u: UserRow | undefined | null, fallback: string): string {
  if (!u) return fallback
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return name || u.email || fallback
}

/**
 * Loads the inbox conversation summaries for a user. Shared by the renter inbox
 * (/messages) and the host-portal inbox (/host/messages) so both stay in sync.
 * Cross-user names/venues are read via the admin client (RLS blocks them).
 */
export async function loadConversationSummaries(
  userId: string,
  unknownLabel: string,
): Promise<ConversationSummary[]> {
  const admin = createAdminClient()
  const { data: convos } = await admin
    .from('conversations')
    .select('id, venue_id, booking_id, renter_id, host_id, created_at')
    .or(`renter_id.eq.${userId},host_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  const conversations = convos ?? []
  if (conversations.length === 0) return []

  const otherIds = Array.from(
    new Set(conversations.map((c) => (c.renter_id === userId ? c.host_id : c.renter_id))),
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
    if (!m.is_read && m.sender_id !== userId) {
      unreadCount.set(m.conversation_id, (unreadCount.get(m.conversation_id) ?? 0) + 1)
    }
  }

  const sortTime = (c: (typeof conversations)[number]) =>
    new Date(lastMessage.get(c.id)?.created_at ?? c.created_at).getTime()
  const sorted = [...conversations].sort((a, b) => sortTime(b) - sortTime(a))

  return sorted.map((c) => {
    const otherId = c.renter_id === userId ? c.host_id : c.renter_id
    const name = displayName(userMap.get(otherId), unknownLabel)
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
}

export interface ThreadData {
  conversationId: string
  currentUserId: string
  initialMessages: { id: string; sender_id: string; content: string; created_at: string }[]
  otherName: string
  venueTitle: string | null
}

/**
 * Loads a single conversation thread for a participant. Returns null when the
 * conversation doesn't exist or the user isn't a participant (caller → notFound).
 * Shared by /messages/[id] and /host/messages/[id].
 */
export async function loadThread(
  conversationId: string,
  userId: string,
  unknownLabel: string,
): Promise<ThreadData | null> {
  const supabase = createClient()

  // RLS restricts SELECT to participants — non-participants get null.
  const { data: convo } = await supabase
    .from('conversations')
    .select('id, venue_id, renter_id, host_id')
    .eq('id', conversationId)
    .single()

  if (!convo || (convo.renter_id !== userId && convo.host_id !== userId)) return null

  const otherId = convo.renter_id === userId ? convo.host_id : convo.renter_id
  const admin = createAdminClient()

  const [otherRes, venueRes, messagesRes] = await Promise.all([
    admin.from('users').select('id, first_name, last_name, email').eq('id', otherId).single(),
    convo.venue_id
      ? admin.from('venues').select('title').eq('id', convo.venue_id).single()
      : Promise.resolve({ data: null as { title: string } | null }),
    supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true }),
  ])

  return {
    conversationId: convo.id,
    currentUserId: userId,
    initialMessages: messagesRes.data ?? [],
    otherName: displayName(otherRes.data as UserRow | null, unknownLabel),
    venueTitle: venueRes.data?.title ?? null,
  }
}
