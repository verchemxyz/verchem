import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chemical Equation Balancer - Free Online Calculator | VerChem',
  description: 'Balance any chemical equation instantly with our free online chemical equation balancer. Supports all reaction types including redox, combustion, and synthesis. Perfect for students and chemists.',
  keywords: [
    'chemical equation balancer',
    'balance chemical equation',
    'chemistry calculator',
    'equation balancer online',
    'free chemical equation balancer',
    'stoichiometry calculator',
    'redox equation balancer',
    'combustion equation',
    'chemical reaction calculator',
    'balance equation calculator',
  ],
  openGraph: {
    title: 'Chemical Equation Balancer - Free Online Calculator',
    description: 'Balance any chemical equation instantly. Free, accurate, and easy to use. Perfect for chemistry students and professionals.',
    type: 'website',
    url: 'https://verchem.xyz/tools/equation-balancer',
    images: [
      {
        url: '/og-equation-balancer.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Chemical Equation Balancer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chemical Equation Balancer - Free Online Calculator',
    description: 'Balance any chemical equation instantly. Free, accurate, and easy to use.',
  },
  alternates: {
    canonical: 'https://verchem.xyz/tools/equation-balancer',
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
