import { test, expect } from '@playwright/test'

// Responsive smoke: the marketing/public shell must render usable navigation at
// both mobile and desktop widths without horizontal overflow.

test('mobile viewport renders the homepage without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }) // iPhone-ish
  await page.goto('/')
  await expect(page.locator('nav').first()).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  // Allow a 1px rounding fudge.
  expect(overflow).toBeLessThanOrEqual(1)
})

test('desktop viewport renders the venue search shell', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/venues')
  await expect(page.locator('nav').first()).toBeVisible()
  await expect(page.locator('footer').first()).toBeVisible()
})
