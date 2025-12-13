import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://verchem.xyz'
  const currentDate = new Date()

  // Static pages
  const staticPages = [
    '',
    '/calculators',
    '/periodic-table',
    '/3d-viewer',
    '/compounds',
    '/tutorials',
    '/preferences',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // Calculator pages
  const calculators = [
    '/equation-balancer',
    '/stoichiometry',
    '/solutions',
    '/gas-laws',
    '/electrochemistry',
    '/thermodynamics',
    '/kinetics',
    '/electron-config',
    '/lewis',
    '/vsepr',
    '/molecule-builder',
    '/virtual-lab/titration',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...calculators]
}
