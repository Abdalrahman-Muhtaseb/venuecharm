import { cookies } from 'next/headers'
import { Resend } from 'resend'
import {
  type Locale,
  defaultLocale,
  isLocale,
  localeCookieName,
  formatCurrencyILS,
  formatDateTimeLocalized,
} from '@/lib/i18n'

const resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'VenueCharm <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export function isResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder'),
  )
}

/** Reads the visitor's locale cookie; falls back to the product default (Hebrew). */
export function getEmailLocale(): Locale {
  const value = cookies().get(localeCookieName)?.value
  return isLocale(value) ? value : defaultLocale
}

interface BookingEmailInput {
  to: string
  recipientName?: string | null
  counterpartName?: string | null
  venueTitle: string
  startAt: string
  endAt: string
  totalPrice?: number
  bookingId: string
  locale?: Locale
}

type EmailKind = 'requested_renter' | 'requested_host' | 'accepted' | 'declined' | 'cancelled_host'

interface EmailCopy {
  subject: string
  heading: string
  intro: string
  cta: string
  ctaPath: (id: string) => string
}

function buildCopy(
  kind: EmailKind,
  locale: Locale,
  data: BookingEmailInput,
): EmailCopy {
  const venue = data.venueTitle
  const renter = data.counterpartName?.trim() || (locale === 'he' ? 'שוכר' : 'a renter')
  const greeting = data.recipientName?.trim()

  const he: Record<EmailKind, EmailCopy> = {
    requested_renter: {
      subject: `קיבלנו את בקשת ההזמנה שלך — ${venue}`,
      heading: 'בקשת ההזמנה נשלחה',
      intro: `${greeting ? `שלום ${greeting}, ` : ''}קיבלנו את בקשתך להזמין את ${venue}. המארח יאשר או ידחה את הבקשה בקרוב, ונעדכן אותך מיד.`,
      cta: 'צפייה בהזמנה',
      ctaPath: (id) => `/bookings/${id}`,
    },
    requested_host: {
      subject: `בקשת הזמנה חדשה — ${venue}`,
      heading: 'בקשת הזמנה חדשה',
      intro: `${greeting ? `שלום ${greeting}, ` : ''}${renter} מבקש/ת להזמין את ${venue}. אשר/י או דחה/י את הבקשה מלוח הבקרה שלך.`,
      cta: 'בדיקת הבקשה',
      ctaPath: (id) => `/host/bookings/${id}`,
    },
    accepted: {
      subject: `ההזמנה שלך אושרה — ${venue}`,
      heading: 'ההזמנה אושרה 🎉',
      intro: `${greeting ? `שלום ${greeting}, ` : ''}חדשות טובות! המארח אישר את הזמנתך עבור ${venue}. נתראה באירוע.`,
      cta: 'צפייה בהזמנה',
      ctaPath: (id) => `/bookings/${id}`,
    },
    declined: {
      subject: `עדכון לגבי בקשת ההזמנה — ${venue}`,
      heading: 'בקשת ההזמנה נדחתה',
      intro: `${greeting ? `שלום ${greeting}, ` : ''}לצערנו המארח לא יכול היה לאשר את בקשתך עבור ${venue}. לא חויבת. נשמח לעזור לך למצוא מקום אחר.`,
      cta: 'חיפוש מקומות נוספים',
      ctaPath: () => `/venues`,
    },
    cancelled_host: {
      subject: `הזמנה בוטלה — ${venue}`,
      heading: 'הזמנה בוטלה',
      intro: `${greeting ? `שלום ${greeting}, ` : ''}${renter} ביטל/ה את ההזמנה עבור ${venue}. התאריך פנוי שוב בלוח השנה שלך.`,
      cta: 'צפייה בהזמנות',
      ctaPath: () => `/host/bookings`,
    },
  }

  const en: Record<EmailKind, EmailCopy> = {
    requested_renter: {
      subject: `We received your booking request — ${venue}`,
      heading: 'Booking request sent',
      intro: `${greeting ? `Hi ${greeting}, ` : ''}we've received your request to book ${venue}. The host will accept or decline shortly, and we'll let you know right away.`,
      cta: 'View booking',
      ctaPath: (id) => `/bookings/${id}`,
    },
    requested_host: {
      subject: `New booking request — ${venue}`,
      heading: 'New booking request',
      intro: `${greeting ? `Hi ${greeting}, ` : ''}${renter} would like to book ${venue}. Accept or decline the request from your dashboard.`,
      cta: 'Review request',
      ctaPath: (id) => `/host/bookings/${id}`,
    },
    accepted: {
      subject: `Your booking is confirmed — ${venue}`,
      heading: 'Booking confirmed 🎉',
      intro: `${greeting ? `Hi ${greeting}, ` : ''}good news! The host accepted your booking for ${venue}. See you at the event.`,
      cta: 'View booking',
      ctaPath: (id) => `/bookings/${id}`,
    },
    declined: {
      subject: `Update on your booking request — ${venue}`,
      heading: 'Booking request declined',
      intro: `${greeting ? `Hi ${greeting}, ` : ''}unfortunately the host couldn't accept your request for ${venue}. You were not charged. Let's help you find another space.`,
      cta: 'Browse more venues',
      ctaPath: () => `/venues`,
    },
    cancelled_host: {
      subject: `Booking cancelled — ${venue}`,
      heading: 'Booking cancelled',
      intro: `${greeting ? `Hi ${greeting}, ` : ''}${renter} cancelled their booking for ${venue}. The dates are now open again on your calendar.`,
      cta: 'View bookings',
      ctaPath: () => `/host/bookings`,
    },
  }

  return locale === 'he' ? he[kind] : en[kind]
}

function ctaButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#7e22ce;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px;">${label}</a>`
}

/** Branded responsive shell shared by all transactional emails. `inner` is the
 *  body markup rendered under the heading (paragraphs, detail cards, CTA). */
function emailShell(locale: Locale, heading: string, inner: string): string {
  const dir = locale === 'he' ? 'rtl' : 'ltr'
  const footerNote =
    locale === 'he'
      ? 'הודעה זו נשלחה אוטומטית מ-VenueCharm.'
      : 'This is an automated message from VenueCharm.'

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <body style="margin:0;padding:0;background:#f4f1f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#3b0764,#7e22ce,#a855f7);padding:20px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-inline-end:12px;">
                      <img src="${APP_URL}/icon.png" width="40" height="40" alt="" style="display:block;border-radius:10px;">
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">VenueCharm</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;text-align:${locale === 'he' ? 'right' : 'left'};">
                <h1 style="margin:0 0 16px;font-size:22px;color:#1f1235;">${heading}</h1>
                ${inner}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #efeaf6;">
                <p style="margin:0;font-size:12px;color:#a39bb5;">${footerNote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function renderHtml(copy: EmailCopy, locale: Locale, data: BookingEmailInput): string {
  const labelWhen = locale === 'he' ? 'מועד' : 'When'
  const labelTotal = locale === 'he' ? 'סכום' : 'Total'

  const when = `${formatDateTimeLocalized(data.startAt, locale)} – ${formatDateTimeLocalized(data.endAt, locale)}`
  const total =
    typeof data.totalPrice === 'number' ? formatCurrencyILS(data.totalPrice, locale) : null
  const ctaUrl = `${APP_URL}${copy.ctaPath(data.bookingId)}`

  const inner = `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b4458;">${copy.intro}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8fd;border-radius:12px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px 20px;font-size:14px;color:#4b4458;">
                      <strong style="color:#1f1235;">${data.venueTitle}</strong><br/>
                      <span style="color:#7c7392;">${labelWhen}:</span> ${when}
                      ${total ? `<br/><span style="color:#7c7392;">${labelTotal}:</span> ${total}` : ''}
                    </td>
                  </tr>
                </table>
                ${ctaButton(ctaUrl, copy.cta)}`

  return emailShell(locale, copy.heading, inner)
}

/** Fire-and-forget send. Never throws — email failures must not break the booking flow. */
async function send(kind: EmailKind, data: BookingEmailInput): Promise<void> {
  if (!isResendConfigured()) return
  if (!data.to) return

  const locale = data.locale ?? defaultLocale
  const copy = buildCopy(kind, locale, data)

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.to,
      subject: copy.subject,
      html: renderHtml(copy, locale, data),
    })
  } catch (err) {
    console.error(`[email] failed to send "${kind}":`, err instanceof Error ? err.message : err)
  }
}

export const sendBookingRequestedToRenter = (d: BookingEmailInput) => send('requested_renter', d)
export const sendBookingRequestedToHost = (d: BookingEmailInput) => send('requested_host', d)
export const sendBookingAcceptedToRenter = (d: BookingEmailInput) => send('accepted', d)
export const sendBookingDeclinedToRenter = (d: BookingEmailInput) => send('declined', d)
export const sendBookingCancelledToHost = (d: BookingEmailInput) => send('cancelled_host', d)

interface PasswordResetEmailInput {
  to: string
  resetUrl: string
  locale?: Locale
}

/** Fire-and-forget password-reset email. We generate the recovery link server-side
 *  (admin API, captcha-exempt) and send it ourselves so captcha stays on login/signup
 *  only. Never throws. */
export async function sendPasswordResetEmail(data: PasswordResetEmailInput): Promise<void> {
  if (!isResendConfigured() || !data.to) return

  const locale = data.locale ?? defaultLocale
  const subject =
    locale === 'he' ? 'איפוס הסיסמה שלך — VenueCharm' : 'Reset your password — VenueCharm'
  const heading = locale === 'he' ? 'איפוס סיסמה' : 'Reset your password'
  const intro =
    locale === 'he'
      ? 'קיבלנו בקשה לאיפוס הסיסמה לחשבונך. לחצו על הכפתור כדי לבחור סיסמה חדשה. אם לא ביקשתם זאת, אפשר להתעלם מהמייל.'
      : 'We received a request to reset your password. Click the button below to choose a new one. If you didn’t request this, you can safely ignore this email.'
  const ctaLabel = locale === 'he' ? 'בחירת סיסמה חדשה' : 'Choose a new password'

  const inner = `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b4458;">${intro}</p>${ctaButton(data.resetUrl, ctaLabel)}`

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.to,
      subject,
      html: emailShell(locale, heading, inner),
    })
  } catch (err) {
    console.error('[email] failed to send "password_reset":', err instanceof Error ? err.message : err)
  }
}

interface BirthdayEmailInput {
  to: string
  name?: string | null
  locale?: Locale
}

/** Fire-and-forget happy-birthday email. Never throws. */
export async function sendBirthdayEmail(data: BirthdayEmailInput): Promise<void> {
  if (!isResendConfigured() || !data.to) return

  const locale = data.locale ?? defaultLocale
  const name = data.name?.trim()
  const subject =
    locale === 'he' ? '🎉 יום הולדת שמח מ-VenueCharm!' : '🎉 Happy birthday from VenueCharm!'
  const heading =
    locale === 'he'
      ? `יום הולדת שמח${name ? `, ${name}` : ''}! 🎂`
      : `Happy birthday${name ? `, ${name}` : ''}! 🎂`
  const intro =
    locale === 'he'
      ? 'כל צוות VenueCharm מאחל לך יום הולדת שמח ושנה מלאה ברגעים בלתי נשכחים. שתמצא/י את המקום המושלם לחגוג בו!'
      : 'The whole VenueCharm team wishes you a wonderful birthday and a year full of memorable moments. May you find the perfect place to celebrate!'
  const ctaLabel = locale === 'he' ? 'מצא/י מקום לחגיגה' : 'Find a place to celebrate'

  const inner = `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b4458;">${intro}</p>${ctaButton(`${APP_URL}/venues`, ctaLabel)}`

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.to,
      subject,
      html: emailShell(locale, heading, inner),
    })
  } catch (err) {
    console.error('[email] failed to send "birthday":', err instanceof Error ? err.message : err)
  }
}
