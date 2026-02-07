import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Spectroscopy | VerChem',
    default: 'Spectroscopy Tools | VerChem',
  },
  description:
    'IR, NMR, and Mass Spectrometry analysis tools for chemistry students and professionals. Identify functional groups, interpret chemical shifts, and analyze fragmentation patterns.',
  keywords: [
    'spectroscopy tools',
    'IR spectroscopy',
    'NMR spectroscopy',
    'mass spectrometry',
    'infrared spectrum interpreter',
    'chemical shift calculator',
    'fragment ion identifier',
    'functional group identification',
    'spectroscopy reference',
    'chemistry education',
  ],
  openGraph: {
    title: 'Spectroscopy Tools | VerChem',
    description:
      'Free IR, NMR, and Mass Spec analysis tools. Identify peaks, interpret spectra, and learn spectroscopy.',
    type: 'website',
    url: 'https://verchem.xyz/spectroscopy',
  },
  alternates: {
    canonical: 'https://verchem.xyz/spectroscopy',
  },
}

export default function SpectroscopyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
