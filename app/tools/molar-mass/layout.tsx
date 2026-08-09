import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Molar Mass Calculator - Free Online Molecular Weight Calculator | VerChem' },
  description: 'Calculate molar mass for supported molecular formulas with an element breakdown and standard atomic weights based on the IUPAC 2021 table.',
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
    description: 'Calculate molar mass for supported formulas with IUPAC-based standard atomic weights and an element breakdown.',
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
    description: 'Calculate molar mass for supported formulas using standard atomic weights based on IUPAC 2021.',
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
