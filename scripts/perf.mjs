// Lighthouse CI runner (see TESTING.md — Performance).
// Builds a PRODUCTION bundle (dev-mode Lighthouse numbers are meaningless),
// then runs @lhci/cli against `next start`. Points everything at the TEST
// Supabase project (never prod) and reuses Playwright's Chromium so no separate
// Chrome install is needed.
import { config } from 'dotenv'
config({ path: '.env.test' })

import { spawnSync } from 'node:child_process'
import { chromium } from '@playwright/test'

// Lighthouse (chrome-launcher) honours CHROME_PATH; reuse Playwright's Chromium.
if (!process.env.CHROME_PATH) {
  process.env.CHROME_PATH = chromium.executablePath()
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('perf: .env.test with NEXT_PUBLIC_SUPABASE_URL is required (never run against prod).')
  process.exit(1)
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: process.env })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// NEXT_PUBLIC_* are inlined at build time, so build with the test env too.
run('npx', ['next', 'build'])
run('npx', ['lhci', 'autorun'])
