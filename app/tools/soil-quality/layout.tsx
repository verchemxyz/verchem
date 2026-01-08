import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Soil Quality Calculator - Heavy Metals, pH, NPK, CEC, Texture | VerChem',
  description: 'Comprehensive soil quality analysis tool. Check heavy metal contamination against Thai PCD standards, classify soil pH, analyze NPK nutrients, calculate CEC, organic matter, texture, and salinity.',
  keywords: [
    'soil quality calculator',
    'heavy metal contamination',
    'Thai PCD standards',
    'soil pH classification',
    'NPK analysis',
    'CEC calculator',
    'cation exchange capacity',
    'organic matter',
    'soil texture triangle',
    'USDA soil classification',
    'soil salinity',
    'sodicity',
    'lead contamination',
    'cadmium contamination',
    'arsenic contamination',
    'agricultural soil',
    'environmental engineering',
  ],
  openGraph: {
    title: 'Soil Quality Calculator | VerChem',
    description: 'Comprehensive soil analysis: Heavy metals (Thai PCD), pH, NPK, CEC, organic matter, texture, and salinity.',
    type: 'website',
  },
}

export default function SoilQualityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
