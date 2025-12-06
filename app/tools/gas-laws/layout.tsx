import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gas Laws Calculator - Ideal Gas, Boyle\'s, Charles\'s Law | VerChem',
  description: 'Calculate gas properties using Ideal Gas Law, Boyle\'s Law, Charles\'s Law, Gay-Lussac\'s Law, Combined Gas Law, and more. Free online gas law calculator for chemistry.',
  keywords: [
    'gas law calculator',
    'ideal gas law calculator',
    'PV=nRT calculator',
    'Boyle\'s law calculator',
    'Charles\'s law calculator',
    'Gay-Lussac\'s law',
    'combined gas law',
    'gas pressure calculator',
    'gas volume calculator',
    'chemistry gas laws',
  ],
  openGraph: {
    title: 'Gas Laws Calculator - Ideal Gas, Boyle\'s, Charles\'s Law',
    description: 'Calculate gas properties instantly using all major gas laws. Free, accurate, and easy to use.',
    type: 'website',
    url: 'https://verchem.xyz/tools/gas-laws',
    images: [
      {
        url: '/og-gas-laws.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Gas Laws Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gas Laws Calculator - Ideal Gas, Boyle\'s, Charles\'s Law',
    description: 'Calculate gas properties instantly using all major gas laws.',
  },
  alternates: {
    canonical: 'https://verchem.xyz/tools/gas-laws',
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
