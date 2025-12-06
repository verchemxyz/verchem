import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Molar Mass Calculator - Free Online Molecular Weight Calculator | VerChem',
  description: 'Calculate molar mass instantly with our free online molecular weight calculator. Supports all chemical compounds, shows element breakdown, and provides accurate atomic masses from NIST data.',
  keywords: [
    'molar mass calculator',
    'molecular weight calculator',
    'molar mass of compounds',
    'molecular mass calculator',
    'calculate molar mass',
    'atomic mass calculator',
    'chemistry molar mass',
    'molecular weight finder',
    'compound mass calculator',
    'formula weight calculator',
  ],
  openGraph: {
    title: 'Molar Mass Calculator - Free Online Molecular Weight Calculator',
    description: 'Calculate molar mass of any compound instantly. Free, accurate NIST data, element breakdown included.',
    type: 'website',
    url: 'https://verchem.xyz/tools/molar-mass',
    images: [
      {
        url: '/og-molar-mass.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Molar Mass Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Molar Mass Calculator - Free Online Molecular Weight Calculator',
    description: 'Calculate molar mass of any compound instantly. Free, accurate, NIST-validated.',
  },
  alternates: {
    canonical: 'https://verchem.xyz/tools/molar-mass',
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
