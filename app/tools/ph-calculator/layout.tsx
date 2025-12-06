import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'pH Calculator - Free Online Acid Base Calculator | VerChem',
  description: 'Calculate pH, pOH, H+ and OH- concentrations instantly. Free online pH calculator for acids, bases, and buffer solutions. Perfect for chemistry students and lab work.',
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
    url: 'https://verchem.xyz/tools/ph-calculator',
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
    canonical: 'https://verchem.xyz/tools/ph-calculator',
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
