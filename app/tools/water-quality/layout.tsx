import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Water Quality Calculator - BOD COD Thai Standards | VerChem',
  description: 'Calculate BOD5, COD, BOD/COD ratio, removal efficiency, and check Thai effluent standards compliance. Free online water quality calculator for environmental engineers.',
  keywords: [
    'BOD calculator',
    'BOD5 calculator',
    'COD calculator',
    'BOD COD ratio',
    'water quality calculator',
    'wastewater calculator',
    'Thai effluent standards',
    'environmental engineering calculator',
    'biodegradability index',
    'removal efficiency calculator',
    'BOD loading rate',
    'Thomas method k-rate',
    'temperature correction BOD',
    'PCD standards Thailand',
    'dichromate COD method',
  ],
  openGraph: {
    title: 'Water Quality Calculator - BOD COD Thai Standards',
    description: 'Calculate BOD, COD, and check Thai effluent standards compliance. Free for environmental engineers.',
    type: 'website',
    url: 'https://verchem.xyz/tools/water-quality',
    images: [
      {
        url: '/og-water-quality.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Water Quality Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Water Quality Calculator - BOD COD Thai Standards',
    description: 'Calculate BOD, COD, removal efficiency. Check Thai effluent standards compliance.',
  },
  alternates: {
    canonical: 'https://verchem.xyz/tools/water-quality',
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
