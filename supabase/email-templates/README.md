# Supabase Auth email templates (branded · bilingual)

These are the HTML bodies for the emails **Supabase itself sends** (signup confirmation,
email change, magic link, etc.). Unlike the booking + password-reset emails — which our
own code sends through Resend (`src/lib/email.ts`) — Supabase owns these sends, so the
only way to brand them is to paste our HTML into the dashboard templates.

Supabase can't pick a language per recipient, so each template is **bilingual** (Hebrew
first, English below) to match the rest of the product.

## How to apply
For each file below: **Supabase dashboard → Authentication → Emails →** pick the template →
**Source** tab → paste the file's contents → set the **Subject** (below) → **Save changes**.
(Resend SMTP is already wired, so delivery is unchanged — only the look changes.)

| Dashboard template      | File                     | Subject |
|-------------------------|--------------------------|---------|
| Confirm signup          | `confirm-signup.html`    | `אישור האימייל · Confirm your email — VenueCharm` |
| Change Email Address     | `change-email.html`      | `אישור שינוי אימייל · Confirm email change — VenueCharm` |
| Magic Link              | `magic-link.html`        | `התחברות · Sign in to VenueCharm` |
| Reset Password          | `reset-password.html`    | `איפוס סיסמה · Reset your password — VenueCharm` |
| Reauthentication        | `reauthentication.html`  | `קוד אימות · Your verification code — VenueCharm` |

Notes:
- Keep the `{{ ... }}` template variables exactly as written — Supabase fills them
  (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`).
- **Reset Password**: our app normally sends this via Resend from our own code
  (captcha-exempt admin link), so this template is just a branded fallback for any
  Supabase-initiated recovery.
- The **Invite** template (if you ever use it) can reuse `confirm-signup.html`.
