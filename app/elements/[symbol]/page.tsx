import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'
import { Element, ElementCategory } from '@/lib/types/chemistry'

// Generate static params for all 118 elements
export async function generateStaticParams() {
  return PERIODIC_TABLE.map((element) => ({
    symbol: element.symbol.toLowerCase(),
  }))
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params
  const element = PERIODIC_TABLE.find(
    (el) => el.symbol.toLowerCase() === symbol.toLowerCase()
  )

  if (!element) {
    return { title: 'Element Not Found | VerChem' }
  }

  const title = `${element.name} (${element.symbol}) - Atomic Properties & Data | VerChem`
  const description = `${element.name} (${element.symbol}): Atomic number ${element.atomicNumber}, mass ${element.atomicMass.toFixed(4)} amu. ${formatCategory(element.category)}. Electron configuration: ${element.electronConfiguration}. Properties, discovery, and more.`

  return {
    title,
    description,
    keywords: [
      element.name,
      element.symbol,
      `${element.name} properties`,
      `${element.name} atomic number`,
      `${element.name} electron configuration`,
      `element ${element.atomicNumber}`,
      formatCategory(element.category),
      'periodic table',
      'chemistry',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://verchem.xyz/elements/${element.symbol.toLowerCase()}`,
      siteName: 'VerChem',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${element.name} (${element.symbol}) | VerChem`,
      description,
    },
    alternates: {
      canonical: `https://verchem.xyz/elements/${element.symbol.toLowerCase()}`,
    },
  }
}

// Helper functions
function formatCategory(category: ElementCategory): string {
  const categoryNames: Record<ElementCategory, string> = {
    'alkali-metal': 'Alkali Metal',
    'alkaline-earth-metal': 'Alkaline Earth Metal',
    'transition-metal': 'Transition Metal',
    'post-transition-metal': 'Post-Transition Metal',
    'metalloid': 'Metalloid',
    'nonmetal': 'Nonmetal',
    'halogen': 'Halogen',
    'noble-gas': 'Noble Gas',
    'lanthanide': 'Lanthanide',
    'actinide': 'Actinide',
    'unknown': 'Unknown',
  }
  return categoryNames[category] || category
}

function getCategoryColor(category: ElementCategory): string {
  const colors: Record<ElementCategory, string> = {
    'alkali-metal': 'bg-red-500',
    'alkaline-earth-metal': 'bg-orange-500',
    'transition-metal': 'bg-yellow-500',
    'post-transition-metal': 'bg-green-500',
    'metalloid': 'bg-teal-500',
    'nonmetal': 'bg-blue-500',
    'halogen': 'bg-indigo-500',
    'noble-gas': 'bg-purple-500',
    'lanthanide': 'bg-pink-500',
    'actinide': 'bg-rose-500',
    'unknown': 'bg-gray-500',
  }
  return colors[category] || 'bg-gray-500'
}

function formatTemperature(kelvin?: number): string {
  if (kelvin === undefined) return 'N/A'
  const celsius = kelvin - 273.15
  return `${kelvin.toFixed(2)} K (${celsius.toFixed(2)} °C)`
}

function getRelatedElements(element: Element): Element[] {
  // Get elements in same group or period
  return PERIODIC_TABLE.filter(
    (el) =>
      el.symbol !== element.symbol &&
      (el.group === element.group || el.period === element.period || el.category === element.category)
  ).slice(0, 6)
}

// Schema.org markup
function ElementSchema({ element }: { element: Element }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: element.name,
    alternateName: element.symbol,
    description: `${element.name} is a chemical element with symbol ${element.symbol} and atomic number ${element.atomicNumber}.`,
    identifier: element.atomicNumber.toString(),
    url: `https://verchem.xyz/elements/${element.symbol.toLowerCase()}`,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the atomic number of ${element.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The atomic number of ${element.name} (${element.symbol}) is ${element.atomicNumber}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the electron configuration of ${element.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The electron configuration of ${element.name} is ${element.electronConfiguration}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the atomic mass of ${element.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The atomic mass of ${element.name} is ${element.atomicMass.toFixed(4)} atomic mass units (amu).`,
        },
      },
      {
        '@type': 'Question',
        name: `What category does ${element.name} belong to?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${element.name} is classified as a ${formatCategory(element.category)} in the periodic table.`,
        },
      },
    ],
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

export default async function ElementPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const element = PERIODIC_TABLE.find(
    (el) => el.symbol.toLowerCase() === symbol.toLowerCase()
  )

  if (!element) {
    notFound()
  }

  const relatedElements = getRelatedElements(element)

  return (
    <>
      <ElementSchema element={element} />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-blue-600 hover:underline">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link href="/periodic-table" className="text-blue-600 hover:underline">Periodic Table</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600 dark:text-gray-300">{element.name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Element Symbol Card */}
              <div className={`w-40 h-40 ${getCategoryColor(element.category)} rounded-2xl flex flex-col items-center justify-center text-white shadow-lg`}>
                <span className="text-sm opacity-80">{element.atomicNumber}</span>
                <span className="text-5xl font-bold">{element.symbol}</span>
                <span className="text-sm mt-1">{element.atomicMass.toFixed(4)}</span>
              </div>

              {/* Element Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {element.name}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                  {formatCategory(element.category)}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                    Period {element.period}
                  </span>
                  {element.group && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                      Group {element.group}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                    Block {element.block.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm capitalize">
                    {element.standardState}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Atomic Properties */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Atomic Properties
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Atomic Number</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{element.atomicNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Atomic Mass</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{element.atomicMass.toFixed(4)} amu</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Electron Configuration</dt>
                  <dd className="font-medium text-gray-900 dark:text-white font-mono text-sm">{element.electronConfiguration}</dd>
                </div>
                {element.electronegativity && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Electronegativity</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.electronegativity} (Pauling)</dd>
                  </div>
                )}
                {element.ionizationEnergy && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Ionization Energy</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.ionizationEnergy} kJ/mol</dd>
                  </div>
                )}
                {element.electronAffinity && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Electron Affinity</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.electronAffinity} kJ/mol</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Oxidation States</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {element.oxidationStates.map(s => s > 0 ? `+${s}` : s).join(', ')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Physical Properties */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Physical Properties
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Standard State</dt>
                  <dd className="font-medium text-gray-900 dark:text-white capitalize">{element.standardState}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Melting Point</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{formatTemperature(element.meltingPoint)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Boiling Point</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{formatTemperature(element.boilingPoint)}</dd>
                </div>
                {element.density && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Density</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.density} g/cm³</dd>
                  </div>
                )}
                {element.atomicRadius && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Atomic Radius</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.atomicRadius} pm</dd>
                  </div>
                )}
                {element.covalentRadius && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Covalent Radius</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.covalentRadius} pm</dd>
                  </div>
                )}
                {element.vanDerWaalsRadius && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Van der Waals Radius</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.vanDerWaalsRadius} pm</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Discovery Section */}
          {(element.discoveryYear || element.discoverer || element.nameMeaning) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Discovery & Etymology
              </h2>
              <dl className="space-y-3">
                {element.discoveryYear && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Discovery Year</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.discoveryYear}</dd>
                  </div>
                )}
                {element.discoverer && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Discoverer</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.discoverer}</dd>
                  </div>
                )}
                {element.nameMeaning && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Name Origin</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{element.nameMeaning}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Related Elements */}
          {relatedElements.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Related Elements
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {relatedElements.map((el) => (
                  <Link
                    key={el.symbol}
                    href={`/elements/${el.symbol.toLowerCase()}`}
                    className={`${getCategoryColor(el.category)} rounded-lg p-3 text-white text-center hover:opacity-90 transition-opacity`}
                  >
                    <span className="text-xs opacity-80">{el.atomicNumber}</span>
                    <div className="text-xl font-bold">{el.symbol}</div>
                    <span className="text-xs truncate block">{el.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tools CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">Explore More Chemistry Tools</h2>
            <p className="opacity-90 mb-4">
              Use our calculators to work with {element.name} in chemical reactions and calculations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/periodic-table"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Interactive Periodic Table
              </Link>
              <Link
                href="/tools/stoichiometry"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Stoichiometry Calculator
              </Link>
              <Link
                href="/tools/molar-mass"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Molar Mass Calculator
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
