import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { SEED_FILE, type SeedData } from './seed'

const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as SeedData

test('robots.txt allows crawling and disallows private routes', async ({ request }) => {
  const res = await request.get('/robots.txt')
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).toContain('User-Agent: *')
  for (const route of ['/admin', '/host', '/api/', '/bookings', '/profile']) {
    expect(body).toContain(`Disallow: ${route}`)
  }
  expect(body).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/i)
})

test('sitemap.xml lists static, help, and the seeded ACTIVE venue', async ({ request }) => {
  const res = await request.get('/sitemap.xml')
  expect(res.status()).toBe(200)
  const xml = await res.text()

  // Static routes
  expect(xml).toContain('/venues')
  expect(xml).toContain('/how-it-works')
  // Help articles
  expect(xml).toContain('/help/')
  // The ACTIVE venue seeded for the run is an indexable page
  expect(xml).toContain(`/venues/${seed.venueId}`)
})
