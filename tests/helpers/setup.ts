// Global test setup. Runs before every test file.
//
// Guard rail: tests must never touch the production Supabase project. Unit tests
// don't set NEXT_PUBLIC_SUPABASE_URL at all (this is a no-op for them). Future
// integration tests load .env.test — this asserts that URL points at a local or
// placeholder project, never production.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL

if (url) {
  const isSafe =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('placeholder') ||
    process.env.ALLOW_REAL_SUPABASE_IN_TESTS === 'true'

  if (!isSafe) {
    throw new Error(
      `Refusing to run tests against a non-local Supabase URL (${url}). ` +
        `Use a dedicated test project via .env.test, or set ` +
        `ALLOW_REAL_SUPABASE_IN_TESTS=true to override.`,
    )
  }
}
