import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { COMPREHENSIVE_COMPOUNDS } from '@/lib/data/compounds'
import { Compound, CompoundCategory } from '@/lib/data/compounds/types'

// Generate static params for all compounds
export async function generateStaticParams() {
  return COMPREHENSIVE_COMPOUNDS.map((compound) => ({
    slug: compound.id,
  }))
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const compound = COMPREHENSIVE_COMPOUNDS.find((c) => c.id === slug)

  if (!compound) {
    return { title: 'Compound Not Found | VerChem' }
  }

  const title = `${compound.name} (${compound.formula}) - Properties & Safety | VerChem`
  const description = `${compound.name}${compound.nameThai ? ` (${compound.nameThai})` : ''}: ${compound.formula}, molar mass ${compound.molarMass.toFixed(2)} g/mol${compound.casNumber ? `, CAS ${compound.casNumber}` : ''}. Properties, safety data, and uses.`

  return {
    title,
    description,
    keywords: [
      compound.name,
      compound.formula,
      compound.casNumber || '',
      compound.nameThai || '',
      `${compound.name} properties`,
      `${compound.name} safety`,
      `${compound.name} uses`,
      formatCategory(compound.category),
      'chemical database',
      'chemistry',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://verchem.xyz/compounds/${compound.id}`,
      siteName: 'VerChem',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${compound.name} (${compound.formula}) | VerChem`,
      description,
    },
    alternates: {
      canonical: `https://verchem.xyz/compounds/${compound.id}`,
    },
  }
}

// Helper functions
function formatCategory(category: CompoundCategory): string {
  const categoryNames: Record<string, string> = {
    'acid': 'Acid',
    'base': 'Base',
    'salt': 'Salt',
    'oxide': 'Oxide',
    'hydrocarbon': 'Hydrocarbon',
    'alcohol': 'Alcohol',
    'carboxylic-acid': 'Carboxylic Acid',
    'ketone': 'Ketone',
    'aldehyde': 'Aldehyde',
    'ester': 'Ester',
    'amine': 'Amine',
    'amide': 'Amide',
    'aromatic': 'Aromatic Compound',
    'amino-acid': 'Amino Acid',
    'sugar': 'Sugar',
    'industrial': 'Industrial Chemical',
    'pharmaceutical': 'Pharmaceutical',
    'reagent': 'Reagent',
    'polymer': 'Polymer',
    'vitamin': 'Vitamin',
    'nucleotide': 'Nucleotide',
    'pollutant': 'Pollutant',
    'semiconductor': 'Semiconductor',
    'superconductor': 'Superconductor',
    'natural-product': 'Natural Product',
    'solvent': 'Solvent',
    'water-treatment': 'Water Treatment Chemical',
    'metal': 'Metal',
    'alloy': 'Alloy',
    'ceramic': 'Ceramic',
    'dye': 'Dye',
    'surfactant': 'Surfactant',
    'other': 'Chemical',
  }
  return categoryNames[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getCategoryColor(category: CompoundCategory): string {
  const colors: Record<string, string> = {
    'acid': 'bg-red-500',
    'base': 'bg-blue-500',
    'salt': 'bg-purple-500',
    'oxide': 'bg-orange-500',
    'hydrocarbon': 'bg-gray-600',
    'alcohol': 'bg-green-500',
    'pharmaceutical': 'bg-pink-500',
    'industrial': 'bg-yellow-600',
    'polymer': 'bg-indigo-500',
    'solvent': 'bg-cyan-500',
    'metal': 'bg-slate-500',
    'ceramic': 'bg-amber-600',
    'amino-acid': 'bg-emerald-500',
  }
  return colors[category] || 'bg-teal-500'
}

function getStateIcon(state: string): string {
  switch (state) {
    case 'solid': return '�ite'
    case 'liquid': return '💧'
    case 'gas': return '💨'
    default: return '🧪'
  }
}

function formatSolubility(solubility: Compound['solubility']): string {
  if (!solubility) return 'N/A'
  if (typeof solubility === 'string') return solubility
  const parts: string[] = []
  if (solubility.water) parts.push(`Water: ${solubility.water}`)
  if (solubility.ethanol) parts.push(`Ethanol: ${solubility.ethanol}`)
  return parts.join('; ') || 'N/A'
}

function formatHazards(hazards: Compound['hazards']): string[] {
  if (!hazards) return []
  if (Array.isArray(hazards)) {
    return hazards.map(h => typeof h === 'string' ? h : h.ghsCode || h.type || '').filter(Boolean)
  }
  return []
}

function getRelatedCompounds(compound: Compound): Compound[] {
  return COMPREHENSIVE_COMPOUNDS.filter(
    (c) => c.id !== compound.id && c.category === compound.category
  ).slice(0, 6)
}

// GHS hazard code descriptions
const GHS_DESCRIPTIONS: Record<string, string> = {
  'H200': 'Unstable explosives',
  'H220': 'Extremely flammable gas',
  'H225': 'Highly flammable liquid and vapor',
  'H226': 'Flammable liquid and vapor',
  'H290': 'May be corrosive to metals',
  'H300': 'Fatal if swallowed',
  'H301': 'Toxic if swallowed',
  'H302': 'Harmful if swallowed',
  'H310': 'Fatal in contact with skin',
  'H314': 'Causes severe skin burns and eye damage',
  'H315': 'Causes skin irritation',
  'H318': 'Causes serious eye damage',
  'H319': 'Causes serious eye irritation',
  'H330': 'Fatal if inhaled',
  'H331': 'Toxic if inhaled',
  'H332': 'Harmful if inhaled',
  'H334': 'May cause allergy or asthma symptoms',
  'H335': 'May cause respiratory irritation',
  'H340': 'May cause genetic defects',
  'H350': 'May cause cancer',
  'H360': 'May damage fertility or the unborn child',
  'H400': 'Very toxic to aquatic life',
  'H410': 'Very toxic to aquatic life with long lasting effects',
}

// Schema.org markup
function CompoundSchema({ compound }: { compound: Compound }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ChemicalSubstance',
    name: compound.name,
    alternateName: compound.nameThai ? [compound.nameThai, compound.iupacName].filter(Boolean) : compound.iupacName ? [compound.iupacName] : undefined,
    molecularFormula: compound.formula,
    identifier: compound.casNumber,
    description: `${compound.name} is a ${formatCategory(compound.category).toLowerCase()} with the chemical formula ${compound.formula}.`,
    url: `https://verchem.xyz/compounds/${compound.id}`,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the chemical formula of ${compound.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The chemical formula of ${compound.name} is ${compound.formula}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the molar mass of ${compound.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The molar mass of ${compound.name} (${compound.formula}) is ${compound.molarMass.toFixed(2)} g/mol.`,
        },
      },
      compound.casNumber ? {
        '@type': 'Question',
        name: `What is the CAS number of ${compound.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The CAS Registry Number of ${compound.name} is ${compound.casNumber}.`,
        },
      } : null,
      compound.uses && compound.uses.length > 0 ? {
        '@type': 'Question',
        name: `What are the uses of ${compound.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${compound.name} is used for: ${compound.uses.join(', ')}.`,
        },
      } : null,
    ].filter(Boolean),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}

export default async function CompoundPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const compound = COMPREHENSIVE_COMPOUNDS.find((c) => c.id === slug)

  if (!compound) {
    notFound()
  }

  const relatedCompounds = getRelatedCompounds(compound)
  const hazardCodes = formatHazards(compound.hazards)

  return (
    <>
      <CompoundSchema compound={compound} />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-blue-600 hover:underline">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link href="/compounds" className="text-blue-600 hover:underline">Compounds</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600 dark:text-gray-300">{compound.name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Compound Card */}
              <div className={`w-32 h-32 ${getCategoryColor(compound.category)} rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0`}>
                <span className="text-3xl mb-1">{getStateIcon(compound.physicalState)}</span>
                <span className="text-lg font-mono font-bold text-center px-2">{compound.formula}</span>
              </div>

              {/* Compound Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {compound.name}
                </h1>
                {compound.nameThai && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-1">
                    {compound.nameThai}
                  </p>
                )}
                {compound.iupacName && compound.iupacName !== compound.name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 italic">
                    IUPAC: {compound.iupacName}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 ${getCategoryColor(compound.category)} text-white rounded-full text-sm`}>
                    {formatCategory(compound.category)}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm capitalize">
                    {compound.physicalState}
                  </span>
                  {compound.casNumber && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-mono">
                      CAS: {compound.casNumber}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {compound.molarMass.toFixed(4)} <span className="text-base font-normal text-gray-500">g/mol</span>
                </p>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Chemical Properties */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Chemical Properties
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Formula</dt>
                  <dd className="font-medium text-gray-900 dark:text-white font-mono">{compound.formula}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Molar Mass</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{compound.molarMass.toFixed(4)} g/mol</dd>
                </div>
                {compound.casNumber && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">CAS Number</dt>
                    <dd className="font-medium text-gray-900 dark:text-white font-mono">{compound.casNumber}</dd>
                  </div>
                )}
                {compound.pKa !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">pKa</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{compound.pKa}</dd>
                  </div>
                )}
                {compound.pKb !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">pKb</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{compound.pKb}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Physical Properties */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Physical Properties
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Physical State</dt>
                  <dd className="font-medium text-gray-900 dark:text-white capitalize">{compound.physicalState}</dd>
                </div>
                {compound.appearance && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Appearance</dt>
                    <dd className="font-medium text-gray-900 dark:text-white text-right max-w-[200px]">{compound.appearance}</dd>
                  </div>
                )}
                {compound.odor && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Odor</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{compound.odor}</dd>
                  </div>
                )}
                {compound.meltingPoint !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Melting Point</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{compound.meltingPoint} °C</dd>
                  </div>
                )}
                {compound.boilingPoint !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Boiling Point</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{compound.boilingPoint} °C</dd>
                  </div>
                )}
                {compound.density !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Density</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{compound.density} g/cm³</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Solubility</dt>
                  <dd className="font-medium text-gray-900 dark:text-white text-right max-w-[200px]">{formatSolubility(compound.solubility)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Safety Section */}
          {(hazardCodes.length > 0 || (compound.ghs && compound.ghs.length > 0)) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8 border-l-4 border-red-500">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-red-500">⚠️</span> Safety Information
              </h2>
              {compound.ghs && compound.ghs.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">GHS Pictograms</h3>
                  <div className="flex flex-wrap gap-2">
                    {compound.ghs.map((code) => (
                      <span key={code} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-mono">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hazardCodes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Hazard Statements</h3>
                  <ul className="space-y-2">
                    {hazardCodes.map((code) => (
                      <li key={code} className="flex items-start gap-2">
                        <span className="font-mono text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded shrink-0">
                          {code}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {GHS_DESCRIPTIONS[code] || 'Hazardous material'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Uses Section */}
          {compound.uses && compound.uses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Uses & Applications
              </h2>
              <ul className="grid md:grid-cols-2 gap-2">
                {compound.uses.map((use, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    {use}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Compounds */}
          {relatedCompounds.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Related Compounds
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {relatedCompounds.map((c) => (
                  <Link
                    key={c.id}
                    href={`/compounds/${c.id}`}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-mono text-sm text-gray-500 dark:text-gray-400">{c.formula}</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">{c.name}</div>
                    {c.nameThai && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.nameThai}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tools CTA */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">Calculate with {compound.name}</h2>
            <p className="opacity-90 mb-4">
              Use our chemistry calculators to work with {compound.formula} in reactions and solutions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tools/molar-mass"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Molar Mass Calculator
              </Link>
              <Link
                href="/tools/stoichiometry"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Stoichiometry Calculator
              </Link>
              <Link
                href="/tools/ph-calculator"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                pH Calculator
              </Link>
              <Link
                href="/compounds"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Browse All Compounds
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
