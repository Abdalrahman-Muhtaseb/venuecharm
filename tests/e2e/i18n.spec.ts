import { test, expect } from '@playwright/test'

// The root layout sets <html lang dir> from the venuecharm-locale cookie.
// Default locale is Hebrew (RTL); English flips to LTR. Drive it via cookie so
// the test doesn't depend on the navbar toggle's markup.

test('defaults to Hebrew / RTL', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', 'he')
  await expect(html).toHaveAttribute('dir', 'rtl')
})

test('locale cookie switches to English / LTR', async ({ context, page }) => {
  const url = new URL(page.url() || 'http://localhost:3100')
  await context.addCookies([
    {
      name: 'venuecharm-locale',
      value: 'en',
      domain: url.hostname || 'localhost',
      path: '/',
    },
  ])
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', 'en')
  await expect(html).toHaveAttribute('dir', 'ltr')
})
