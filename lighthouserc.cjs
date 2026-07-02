// Lighthouse CI config. Run via `npm run test:perf` (see scripts/perf.mjs),
// which builds a production bundle and points at the test Supabase project.
// Budgets are warn-only: perf varies by machine/CI runner, so this documents
// and surfaces regressions without gating merges.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx next start -p 3200',
      startServerReadyPattern: 'Ready in',
      url: [
        'http://localhost:3200/',
        'http://localhost:3200/venues',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        // Baselined against measured prod scores (/ and /venues ~92 perf,
        // LCP ~1.7s, CLS <0.03). Warn-only — surfaces regressions, never gates.
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-report',
    },
  },
}
