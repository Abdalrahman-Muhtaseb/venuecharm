import { test, expect } from '@playwright/test'

// Public, unauthenticated routes — no data mutation, safe against any environment.
// Each asserts the route responds < 400 and renders real content (not an error).
const routes = [
  { path: '/', name: 'homepage' },
  { path: '/venues', name: 'venue search' },
  { path: '/how-it-works', name: 'how it works' },
  { path: '/pricing', name: 'pricing' },
  { path: '/help', name: 'help center' },
]

for (const { path, name } of routes) {
  test(`${name} (${path}) loads and renders content`, async ({ page }) => {
    const res = await page.goto(path)
    expect(res, `no response for ${path}`).not.toBeNull()
    expect(res!.status(), `bad status for ${path}`).toBeLessThan(400)

    // Real content rendered, not a blank/error page.
    const text = await page.locator('body').innerText()
    expect(text.trim().length).toBeGreaterThan(50)
  })
}

test('venue search page shows the public navbar', async ({ page }) => {
  await page.goto('/venues')
  await expect(page.locator('nav').first()).toBeVisible()
})

test('unknown route returns a 404', async ({ page }) => {
  const res = await page.goto('/this-route-does-not-exist-xyz')
  expect(res?.status()).toBe(404)
})
