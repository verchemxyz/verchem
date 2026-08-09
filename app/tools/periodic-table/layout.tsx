import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Interactive Periodic Table - Free Online Element Database | VerChem' },
  description: 'Explore all 118 elements with an interactive periodic table. Standard atomic weights are based on IUPAC 2021; selected properties cite NIST and CRC references.',
  keywords: [
    'periodic table',
    'interactive periodic table',
    'periodic table of elements',
    'element properties',
    'atomic mass',
    'electron configuration',
    'chemical elements',
    'periodic table online',
    'element database',
    'chemistry periodic table',
  ],
  openGraph: {
    title: 'Interactive Periodic Table - Free Online Element Database',
    description: 'Explore all 118 elements with cited IUPAC, NIST, and CRC reference data. Free and interactive.',
    type: 'website',
    url: 'https://verchem.xyz/tools/periodic-table',
    images: [
      {
        url: '/og-periodic-table.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Interactive Periodic Table',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive Periodic Table - Free Online Element Database',
    description: 'Explore all 118 elements with detailed properties. Free and interactive.',
  },
  alternates: {
    canonical: 'https://verchem.xyz/tools/periodic-table',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
