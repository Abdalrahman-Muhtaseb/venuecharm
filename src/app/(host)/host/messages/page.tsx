import { cookies } from 'next/headers'
import { MessageSquare } from 'lucide-react'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function HostMessagesIndexPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).messages
  const isHe = locale === 'he'

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-base font-semibold">{isHe ? 'בחר שיחה' : 'Select a conversation'}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{t.inboxEmptyHint}</p>
    </div>
  )
}
