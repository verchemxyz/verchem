import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VerChem Lab - Verified Chemistry Evidence',
    short_name: 'VerChem',
    description: 'Controlled standard-preparation records, independently released evidence, and deterministic chemistry tools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF6',
    theme_color: '#0F6764',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['education', 'utilities'],
    lang: 'en',
    dir: 'ltr',
  }
}
