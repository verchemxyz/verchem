import { Metadata } from 'next'
import { ADM1Digester } from '@/components/wastewater'

export const metadata: Metadata = {
  title: 'ADM1 Anaerobic Digester Simulator | VerChem',
  description: 'Free online ADM1 biogas simulator. Calculate methane production, COD removal, and optimize anaerobic digestion. IWA Anaerobic Digestion Model No. 1 with 24 state variables and 19 processes.',
  keywords: [
    'ADM1', 'anaerobic digestion', 'biogas calculator', 'methane production',
    'wastewater treatment', 'sludge digestion', 'COD removal', 'biogas energy',
    'digester design', 'IWA model'
  ],
  openGraph: {
    title: 'ADM1 Anaerobic Digester Simulator',
    description: 'Free online ADM1 biogas simulator - Calculate methane production and optimize anaerobic digestion',
    type: 'website',
  },
}

export default function ADM1SimulatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ADM1Digester />
      </div>
    </div>
  )
}
