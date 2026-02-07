import { MetadataRoute } from 'next'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'
import { COMPREHENSIVE_COMPOUNDS } from '@/lib/data/compounds'
import { NAMED_REACTIONS } from '@/lib/data/organic/named-reactions'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://verchem.xyz'
  const currentDate = new Date()

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    // Main Pages
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/supporters`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Tools & Calculators
    {
      url: `${baseUrl}/tools/molar-mass`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/periodic-table`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/equation-balancer`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/stoichiometry`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/ph-calculator`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/gas-laws`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compounds`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/elements`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calculators`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Organic Chemistry
    {
      url: `${baseUrl}/organic`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/organic/functional-groups`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/organic/reactions`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/organic/predict`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Spectroscopy
    {
      url: `${baseUrl}/spectroscopy`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/spectroscopy/ir`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/spectroscopy/nmr`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/spectroscopy/mass-spec`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Lab & Practical
    {
      url: `${baseUrl}/tools/solution-prep`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/lab-safety`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Advanced Chemistry
    {
      url: `${baseUrl}/tools/nuclear`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/quantum`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // Dynamic element pages (118 elements)
  const elementRoutes: MetadataRoute.Sitemap = PERIODIC_TABLE.map((element) => ({
    url: `${baseUrl}/elements/${element.symbol.toLowerCase()}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Dynamic compound pages (1,130+ compounds)
  const compoundRoutes: MetadataRoute.Sitemap = COMPREHENSIVE_COMPOUNDS.map((compound) => ({
    url: `${baseUrl}/compounds/${compound.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic reaction pages (40 reactions)
  const reactionRoutes: MetadataRoute.Sitemap = NAMED_REACTIONS.map((reaction) => ({
    url: `${baseUrl}/organic/reactions/${reaction.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...elementRoutes, ...compoundRoutes, ...reactionRoutes]
}
