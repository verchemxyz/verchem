import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'pH Calculator | VerChem',
  description: 'Legacy URL for the canonical VerChem Solutions & pH calculator.',
  keywords: [
    'pH calculator',
    'pH calculation',
    'pOH calculator',
    'acid base calculator',
    'hydrogen ion concentration',
    'hydroxide ion concentration',
    'buffer pH calculator',
    'strong acid pH',
    'weak acid pH',
    'chemistry pH',
  ],
  openGraph: {
    title: 'pH Calculator - Free Online Acid Base Calculator',
    description: 'Calculate pH, pOH, and ion concentrations instantly. Free, accurate, and easy to use.',
    type: 'website',
    url: 'https://verchem.xyz/solutions',
    images: [
      {
        url: '/og-ph-calculator.png',
        width: 1200,
        height: 630,
        alt: 'VerChem pH Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'pH Calculator - Free Online Acid Base Calculator',
    description: 'Calculate pH, pOH, and ion concentrations instantly. Free and accurate.',
  },
  alternates: {
    canonical: 'https://verchem.xyz/solutions',
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
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
