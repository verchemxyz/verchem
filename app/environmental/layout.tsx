import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Environmental Engineering Tools | VerChem',
    template: '%s | VerChem Environmental',
  },
  description:
    'Professional environmental engineering tools: Wastewater Treatment Designer, Water Quality, Air Quality, Soil Quality calculators with Thai PCD standards compliance. Free forever.',
  keywords: [
    'environmental engineering tools',
    'wastewater treatment design',
    'water quality calculator',
    'air quality calculator',
    'soil quality calculator',
    'Thai PCD standards',
    'BOD COD calculation',
    'treatment plant design',
    'activated sludge',
    'effluent standards Thailand',
  ],
  openGraph: {
    title: 'Environmental Engineering Tools | VerChem',
    description: 'Professional environmental engineering tools with Thai PCD standards. Design wastewater treatment systems, analyze water/air/soil quality. Free forever.',
    type: 'website',
    locale: 'en_US',
    siteName: 'VerChem',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Environmental Engineering Tools | VerChem',
    description: 'Professional environmental engineering tools with Thai PCD standards. Free forever.',
  },
}

export default function EnvironmentalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
