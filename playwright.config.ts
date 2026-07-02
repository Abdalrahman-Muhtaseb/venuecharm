import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// E2E runs on a dedicated port so it never reuses a prod-pointed `next dev` on
// :3000. Set PLAYWRIGHT_BASE_URL to test against an already-running server.
const PORT = 3100
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

// Point the E2E dev server at the TEST Supabase project, never prod. `next dev`
// would otherwise load .env.local (prod); shell/process env takes precedence in
// Next, so we inject .env.test here.
const testEnv = loadEnv({ path: '.env.test' }).parsed

if (!process.env.PLAYWRIGHT_BASE_URL && !testEnv?.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'E2E: .env.test with NEXT_PUBLIC_SUPABASE_URL is required to start the test server ' +
      '(refusing to risk running E2E against production).',
  )
}

const serverEnv = {
  ...process.env,
  ...(testEnv ?? {}),
  NEXT_PUBLIC_APP_URL: baseURL,
} as Record<string, string>

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  // One dev server + one shared test DB → run serially to avoid contention/races.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
        env: serverEnv,
      },
})
