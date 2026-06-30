import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MessageThread } from '@/components/messaging/MessageThread'
import { loadThread } from '@/lib/messages-data'
import {
  defaultLocale,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

export default async function HostMessageThreadPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).messages

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thread = await loadThread(params.id, user.id, t.unknownUser)
  if (!thread) notFound()

  return (
    <MessageThread
      conversationId={thread.conversationId}
      currentUserId={thread.currentUserId}
      initialMessages={thread.initialMessages}
      otherName={thread.otherName}
      venueTitle={thread.venueTitle}
      locale={locale}
      basePath="/host/messages"
    />
  )
}
