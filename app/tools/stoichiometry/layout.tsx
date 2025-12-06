import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stoichiometry Calculator - Free Mass, Mole, Limiting Reagent | VerChem',
  description: 'Calculate stoichiometry problems instantly. Mass to mole, mole to mass, limiting reagent, percent yield, and more. Free online stoichiometry calculator for chemistry.',
  keywords: [
    'stoichiometry calculator',
    'stoichiometry problems',
    'mole to mass calculator',
    'mass to mole calculator',
    'limiting reagent calculator',
    'percent yield calculator',
    'theoretical yield',
    'chemistry stoichiometry',
    'mole ratio calculator',
    'stoichiometry solver',
  ],
  openGraph: {
    title: 'Stoichiometry Calculator - Free Mass, Mole, Limiting Reagent',
    description: 'Solve stoichiometry problems instantly. Mass-mole conversions, limiting reagent, percent yield calculator.',
    type: 'website',
    url: 'https://verchem.xyz/tools/stoichiometry',
    images: [
      {
        url: '/og-stoichiometry.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Stoichiometry Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stoichiometry Calculator - Free Mass, Mole, Limiting Reagent',
    description: 'Solve stoichiometry problems instantly. Free and accurate.',
  },
  alternates: {
    canonical: 'https://verchem.xyz/tools/stoichiometry',
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
