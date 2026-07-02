import { test, expect } from '@playwright/test'

// Phase 5 placeholder. Run with `npm run test:e2e` after `npx playwright install`.
// The webServer in playwright.config.ts boots `npm run dev` automatically.
test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/VenueCharm|Venue/i)
})
