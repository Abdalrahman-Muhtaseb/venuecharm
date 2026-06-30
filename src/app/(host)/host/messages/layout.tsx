import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ConversationList } from '@/components/messaging/ConversationList'
import { MessagesPanes } from '@/components/messaging/MessagesPanes'
import { loadConversationSummaries } from '@/lib/messages-data'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function HostMessagesLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).messages

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const summaries = await loadConversationSummaries(user.id, t.unknownUser)

  return (
    <div className="flex h-full flex-col overflow-hidden">
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
            basePath="/host/messages"
          />
        }
      >
        {children}
      </MessagesPanes>
    </div>
  )
}
