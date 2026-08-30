import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Chemical Equation Balancer - Free Online Calculator | VerChem' },
  description: 'Balance molecular chemical equations with a free online balancer. Handles synthesis, decomposition, combustion, replacement and redox reactions written in molecular form. Every result is checked for atom conservation.',
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
    description: 'Balance molecular chemical equations instantly. Free, atom-conservation checked, and easy to use.',
    type: 'website',
    url: 'https://verchem.xyz/tools/equation-balancer',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Chemical Equation Balancer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chemical Equation Balancer - Free Online Calculator',
    description: 'Balance molecular chemical equations instantly. Free and atom-conservation checked.',
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
