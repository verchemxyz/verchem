import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wastewater Treatment System Builder | VerChem',
  description: 'Design and simulate wastewater treatment systems. Build treatment trains with activated sludge, clarifiers, disinfection units. Check compliance with Thai PCD effluent standards.',
  keywords: [
    'wastewater treatment design',
    'treatment train builder',
    'activated sludge calculator',
    'BOD removal',
    'COD removal',
    'Thai effluent standards',
    'PCD compliance',
    'environmental engineering',
    'ระบบบำบัดน้ำเสีย',
    'ออกแบบระบบบำบัด',
    'มาตรฐานน้ำทิ้ง',
    'กรมควบคุมมลพิษ',
  ],
  openGraph: {
    title: 'Wastewater Treatment System Builder | VerChem',
    description: 'Design complete wastewater treatment systems with real-time calculations and Thai PCD compliance checking.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'th_TH',
  },
}

export default function WastewaterTreatmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
