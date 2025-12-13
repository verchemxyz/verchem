import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://verchem.xyz'
  const currentDate = new Date()

  // Public static pages (should be indexable)
  const staticPages = [
    { route: '', changeFrequency: 'monthly' as const, priority: 1.0 },
    { route: '/tools', changeFrequency: 'weekly' as const, priority: 0.9 },
    { route: '/support', changeFrequency: 'monthly' as const, priority: 0.8 },
    { route: '/supporters', changeFrequency: 'monthly' as const, priority: 0.7 },
  ].map(({ route, changeFrequency, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency,
    priority,
  }))

  // SEO landing pages (public, marketing + content)
  const toolPages = [
    '/tools/molar-mass',
    '/tools/periodic-table',
    '/tools/equation-balancer',
    '/tools/stoichiometry',
    '/tools/ph-calculator',
    '/tools/gas-laws',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...toolPages]
}
