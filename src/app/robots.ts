import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private, auth, and transactional routes shouldn't be indexed.
      disallow: [
        '/api/',
        '/admin',
        '/dashboard',
        '/listings',
        '/host',
        '/bookings',
        '/messages',
        '/favorites',
        '/rfp',
        '/profile',
        '/onboarding',
        '/notifications',
        '/login',
        '/register',
        '/verify-email',
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
