import type { Metadata } from 'next'
import { SOLUTIONS_MODE_COUNT } from '@/lib/config/solutions'

export const metadata: Metadata = {
  title: { absolute: 'Solutions & pH Calculator | VerChem' },
  description: `${SOLUTIONS_MODE_COUNT} deterministic molarity, aqueous pH, pOH, ion-concentration, buffer, and dilution modes with explicit ideal-dilute 25 °C model scope.`,
  keywords: [
    'pH calculator',
    'pOH calculator',
    'acid base calculator',
    'buffer pH calculator',
    'molarity calculator',
    'dilution calculator',
  ],
  alternates: {
    canonical: 'https://verchem.xyz/solutions',
  },
  openGraph: {
    title: 'Solutions & pH Calculator | VerChem',
    description: `${SOLUTIONS_MODE_COUNT} molarity, aqueous pH, pOH, ion-concentration, buffer, and dilution modes with declared model scope.`,
    type: 'website',
    url: 'https://verchem.xyz/solutions',
    images: [
      {
        url: '/og-ph-calculator.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Solutions and pH Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solutions & pH Calculator | VerChem',
    description: `${SOLUTIONS_MODE_COUNT} molarity, aqueous pH, pOH, ion-concentration, buffer, and dilution modes with declared model scope.`,
  },
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
