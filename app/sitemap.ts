import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE = 'https://printmarkethub.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  // Fetch public maker profiles
  const { data: makers } = await admin
    .from('printer_profiles')
    .select('user_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  // Fetch open jobs
  const { data: jobs } = await admin
    .from('jobs')
    .select('id, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(500)

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/jobs`,     lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/makers`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/map`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/signup`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/login`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/terms`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/legal/privacy`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/legal/impressum`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
  ]

  const makerRoutes: MetadataRoute.Sitemap = (makers ?? []).map((m) => ({
    url:              `${BASE}/makers/${m.user_id}`,
    lastModified:     m.updated_at ? new Date(m.updated_at) : new Date(),
    changeFrequency:  'weekly',
    priority:         0.7,
  }))

  const jobRoutes: MetadataRoute.Sitemap = (jobs ?? []).map((j) => ({
    url:             `${BASE}/jobs/${j.id}`,
    lastModified:    j.created_at ? new Date(j.created_at) : new Date(),
    changeFrequency: 'daily',
    priority:        0.6,
  }))

  return [...staticRoutes, ...makerRoutes, ...jobRoutes]
}
