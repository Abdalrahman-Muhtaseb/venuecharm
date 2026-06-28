import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { helpArticles } from '@/lib/help-content'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/venues`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const helpRoutes: MetadataRoute.Sitemap = helpArticles.map((a) => ({
    url: `${APP_URL}/help/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  // Active venues are publicly visible (RLS), so each is an indexable page.
  let venueRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('venues')
      .select('id, updated_at')
      .eq('status', 'ACTIVE')
    venueRoutes = (data ?? []).map((v) => ({
      url: `${APP_URL}/venues/${v.id}`,
      lastModified: v.updated_at ? new Date(v.updated_at as string) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch {
    // Sitemap still serves the static + help routes if the DB is unreachable.
  }

  return [...staticRoutes, ...helpRoutes, ...venueRoutes]
}
