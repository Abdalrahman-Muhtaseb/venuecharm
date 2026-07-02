import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { SEED_FILE, findBookingStatus, type SeedData } from './seed'

const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as SeedData

// Full authenticated journey: a renter logs in through the real UI, opens the
// seeded venue, books a full day, and lands on checkout with a PENDING booking
// persisted in the DB. Uses English locale for stable labels.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: 'venuecharm-locale', value: 'en', domain: 'localhost', path: '/' },
  ])
})

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.locator('#login-email').fill(seed.renterEmail)
  await page.locator('#login-password').fill(seed.renterPassword)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  // Client-side sign-in redirects to '/' (profile has a first name) or /onboarding.
  await page.waitForURL(
    (u) => {
      const p = new URL(u).pathname
      return p === '/' || p.startsWith('/onboarding')
    },
    { timeout: 20_000 },
  )
}

async function pickFullDayDate(page: import('@playwright/test').Page) {
  // Full-day venue → the widget shows only a date picker. Choose today + 3 days.
  const target = new Date()
  target.setDate(target.getDate() + 3)

  await page.getByRole('button', { name: /pick a date/i }).first().click()

  // The venue page also has an inline availability calendar, so scope to the
  // popover dialog we just opened. Wait for it to actually open before clicking.
  const popover = page.getByRole('dialog')
  await expect(popover).toBeVisible()

  // react-day-picker renders the current month by default; advance if the
  // target rolled into next month.
  if (target.getMonth() !== new Date().getMonth()) {
    await popover.locator('.rdp-button_next').click()
  }

  // Day buttons carry data-day = toLocaleDateString() (en-US: "M/D/YYYY").
  const dataDay = `${target.getMonth() + 1}/${target.getDate()}/${target.getFullYear()}`
  const dayButton = popover.locator(`[data-day="${dataDay}"]`)
  await expect(dayButton).toBeVisible()
  await dayButton.click()
  // This widget's calendar doesn't auto-close on select; dismiss it so it can't
  // intercept the Continue click.
  await page.keyboard.press('Escape')
  await expect(popover).toBeHidden()
}

test('renter can log in and request a full-day booking', async ({ page }) => {
  await login(page)

  await page.goto(`/venues/${seed.venueId}`)
  await expect(page.getByRole('button', { name: /continue to payment/i })).toBeVisible()

  await pickFullDayDate(page)

  const submit = page.getByRole('button', { name: /continue to payment/i })
  await expect(submit).toBeEnabled()
  await submit.click()

  // Server action creates the PENDING booking and redirects to checkout.
  await page.waitForURL(/\/venues\/.*\/checkout/, { timeout: 20_000 })

  // Confirm the booking was actually persisted as PENDING.
  const status = await findBookingStatus(seed.venueId, seed.renterId)
  expect(status).toBe('PENDING')
})
