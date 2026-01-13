import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ASM1 Biokinetic Simulator | VerChem',
  description:
    'Free ASM1 (Activated Sludge Model No. 1) simulator for wastewater treatment design. Research-grade biokinetic modeling with 8 processes, 13 state variables, and Runge-Kutta solver. Competing with GPS-X ($15,000).',
  keywords: [
    'ASM1',
    'Activated Sludge Model',
    'wastewater treatment',
    'biokinetic modeling',
    'CSTR simulation',
    'nitrification',
    'denitrification',
    'COD removal',
    'IWA model',
    'GPS-X alternative',
    'BioWin alternative',
    'free wastewater software',
  ],
  openGraph: {
    title: 'ASM1 Biokinetic Simulator | VerChem',
    description:
      'Free research-grade ASM1 simulator for wastewater treatment. 8 biological processes, 13 state variables, dynamic simulation.',
    type: 'website',
  },
}

export default function ASM1SimulatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
