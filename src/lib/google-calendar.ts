import { google } from 'googleapis'

/**
 * Google Calendar integration (host side). Low-level OAuth + event helpers.
 * Guarded by isGoogleCalendarConfigured() so the app runs without credentials.
 */

// 'calendar' is the superset scope — it covers event CRUD AND creating/
// deleting calendars (required for per-venue calendar creation).
// Existing tokens granted only 'calendar.events' must reconnect.
const SCOPES = ['https://www.googleapis.com/auth/calendar']

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
  )
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  )
}

/** Consent URL — offline + prompt=consent so Google returns a refresh token. */
export function getAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  })
}

export async function exchangeCodeForRefreshToken(code: string): Promise<string | null> {
  const { tokens } = await oauthClient().getToken(code)
  return tokens.refresh_token ?? null
}

function calendarFor(refreshToken: string) {
  const auth = oauthClient()
  auth.setCredentials({ refresh_token: refreshToken })
  return google.calendar({ version: 'v3', auth })
}

export interface CalendarEventInput {
  summary: string
  description?: string
  location?: string
  start: string // ISO timestamp
  end: string // ISO timestamp
}

/** Create an event; returns the Google event id (or null). */
export async function createEvent(
  refreshToken: string,
  calendarId: string,
  ev: CalendarEventInput,
): Promise<string | null> {
  const calendar = calendarFor(refreshToken)
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: ev.summary,
      description: ev.description,
      location: ev.location,
      start: { dateTime: new Date(ev.start).toISOString() },
      end: { dateTime: new Date(ev.end).toISOString() },
    },
  })
  return res.data.id ?? null
}

export async function deleteEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const calendar = calendarFor(refreshToken)
  await calendar.events.delete({ calendarId, eventId })
}

/** Create a new calendar under this account; returns its ID. */
export async function createCalendar(refreshToken: string, title: string): Promise<string | null> {
  const calendar = calendarFor(refreshToken)
  const res = await calendar.calendars.insert({ requestBody: { summary: title } })
  return res.data.id ?? null
}
