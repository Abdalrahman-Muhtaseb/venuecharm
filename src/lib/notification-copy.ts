import type { Locale } from '@/lib/i18n'

/**
 * Notification event types. The bell/page render localized title + body per type
 * from the stored `data` payload, so text always matches the VIEWER's locale.
 */
export type NotificationType =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'message'
  | 'review'

export interface NotificationData {
  venueTitle?: string
  /** First name of the person who triggered the event (renter or host). */
  actorName?: string | null
  rating?: number
  [key: string]: unknown
}

export interface NotificationRow {
  id: string
  type: NotificationType
  data: NotificationData
  link: string | null
  is_read: boolean
  created_at: string
}

function fallbackActor(locale: Locale): string {
  return locale === 'he' ? 'מישהו' : 'Someone'
}

/** Render a notification's title + body in the viewer's locale. */
export function notificationCopy(
  n: Pick<NotificationRow, 'type' | 'data'>,
  locale: Locale,
): { title: string; body: string } {
  const he = locale === 'he'
  const venue = n.data.venueTitle?.trim() || (he ? 'מקום' : 'a venue')
  const actor = n.data.actorName?.trim() || fallbackActor(locale)
  const rating = Number(n.data.rating ?? 0)

  switch (n.type) {
    case 'booking_requested':
      return he
        ? { title: 'בקשת הזמנה חדשה', body: `${actor} ביקש/ה להזמין את ${venue}` }
        : { title: 'New booking request', body: `${actor} requested to book ${venue}` }
    case 'booking_accepted':
      return he
        ? { title: 'ההזמנה אושרה 🎉', body: `הזמנתך עבור ${venue} אושרה` }
        : { title: 'Booking accepted 🎉', body: `Your booking for ${venue} was accepted` }
    case 'booking_declined':
      return he
        ? { title: 'בקשת ההזמנה נדחתה', body: `בקשתך עבור ${venue} נדחתה` }
        : { title: 'Booking declined', body: `Your request for ${venue} was declined` }
    case 'booking_cancelled':
      return he
        ? { title: 'הזמנה בוטלה', body: `${actor} ביטל/ה את ההזמנה עבור ${venue}` }
        : { title: 'Booking cancelled', body: `${actor} cancelled their booking for ${venue}` }
    case 'message':
      return he
        ? { title: 'הודעה חדשה', body: `קיבלת הודעה מ${actor}` }
        : { title: 'New message', body: `${actor} sent you a message` }
    case 'review':
      return he
        ? { title: 'ביקורת חדשה', body: `${actor} השאיר/ה ביקורת של ${rating}★ על ${venue}` }
        : { title: 'New review', body: `${actor} left a ${rating}★ review on ${venue}` }
    default:
      return { title: he ? 'התראה' : 'Notification', body: '' }
  }
}
