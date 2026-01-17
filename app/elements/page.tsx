import { Metadata } from 'next'
import Link from 'next/link'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'
import { ElementCategory } from '@/lib/types/chemistry'

// Static metadata for SEO
export const metadata: Metadata = {
  title: 'Periodic Table of Elements - All 118 Elements | VerChem',
  description: 'Complete periodic table with all 118 chemical elements. Browse elements by category: alkali metals, transition metals, noble gases, and more. Detailed atomic properties, electron configurations, and physical data.',
  keywords: [
    'periodic table',
    'chemical elements',
    '118 elements',
    'atomic properties',
    'electron configuration',
    'alkali metals',
    'transition metals',
    'noble gases',
    'lanthanides',
    'actinides',
    'chemistry reference',
  ],
  openGraph: {
    title: 'Periodic Table of Elements | VerChem',
    description: 'Explore all 118 chemical elements with detailed atomic data, electron configurations, and physical properties.',
    type: 'website',
    url: 'https://verchem.xyz/elements',
    siteName: 'VerChem',
  },
  alternates: {
    canonical: 'https://verchem.xyz/elements',
  },
}

// Element categories with display info
const CATEGORIES: { id: ElementCategory; name: string; color: string; bgColor: string; count: number }[] = [
  { id: 'alkali-metal', name: 'Alkali Metals', color: 'text-red-700', bgColor: 'bg-red-100 hover:bg-red-200', count: 6 },
  { id: 'alkaline-earth-metal', name: 'Alkaline Earth Metals', color: 'text-orange-700', bgColor: 'bg-orange-100 hover:bg-orange-200', count: 6 },
  { id: 'transition-metal', name: 'Transition Metals', color: 'text-yellow-700', bgColor: 'bg-yellow-100 hover:bg-yellow-200', count: 38 },
  { id: 'post-transition-metal', name: 'Post-Transition Metals', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200', count: 7 },
  { id: 'metalloid', name: 'Metalloids', color: 'text-teal-700', bgColor: 'bg-teal-100 hover:bg-teal-200', count: 7 },
  { id: 'nonmetal', name: 'Nonmetals', color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200', count: 7 },
  { id: 'halogen', name: 'Halogens', color: 'text-indigo-700', bgColor: 'bg-indigo-100 hover:bg-indigo-200', count: 5 },
  { id: 'noble-gas', name: 'Noble Gases', color: 'text-purple-700', bgColor: 'bg-purple-100 hover:bg-purple-200', count: 7 },
  { id: 'lanthanide', name: 'Lanthanides', color: 'text-pink-700', bgColor: 'bg-pink-100 hover:bg-pink-200', count: 15 },
  { id: 'actinide', name: 'Actinides', color: 'text-rose-700', bgColor: 'bg-rose-100 hover:bg-rose-200', count: 15 },
  { id: 'unknown', name: 'Unknown Properties', color: 'text-gray-700', bgColor: 'bg-gray-100 hover:bg-gray-200', count: 5 },
]

function getCategoryStyle(category: ElementCategory): { bg: string; text: string; border: string } {
  const styles: Record<ElementCategory, { bg: string; text: string; border: string }> = {
    'alkali-metal': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
    'alkaline-earth-metal': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
    'transition-metal': { bg: 'bg-yellow-500', text: 'text-gray-900', border: 'border-yellow-600' },
    'post-transition-metal': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
    'metalloid': { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
    'nonmetal': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
    'halogen': { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600' },
    'noble-gas': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
    'lanthanide': { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
    'actinide': { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
    'unknown': { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-500' },
  }
  return styles[category] || styles.unknown
}

// Group elements by category for display
function groupElementsByCategory() {
  const groups: Record<string, typeof PERIODIC_TABLE> = {}

  for (const element of PERIODIC_TABLE) {
    const category = element.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(element)
  }

  return groups
}

export default function ElementsIndexPage() {
  const groupedElements = groupElementsByCategory()

  // JSON-LD Schema for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Periodic Table of Elements',
    description: 'Complete list of all 118 chemical elements',
    numberOfItems: 118,
    itemListElement: PERIODIC_TABLE.slice(0, 20).map((element, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'ChemicalSubstance',
        name: element.name,
        alternateName: element.symbol,
        url: `https://verchem.xyz/elements/${element.symbol.toLowerCase()}`,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-blue-600">Ver</span>
                <span className="text-gray-900">Chem</span>
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/tools/periodic-table"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                Interactive Periodic Table →
              </Link>
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
              Periodic Table of Elements
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explore all <span className="font-bold text-purple-600">118 chemical elements</span> with detailed
              atomic properties, electron configurations, and physical data. Click any element to learn more.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md px-6 py-4">
                <div className="text-3xl font-bold text-purple-600">118</div>
                <div className="text-sm text-gray-500">Elements</div>
              </div>
              <div className="bg-white rounded-xl shadow-md px-6 py-4">
                <div className="text-3xl font-bold text-blue-600">11</div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
              <div className="bg-white rounded-xl shadow-md px-6 py-4">
                <div className="text-3xl font-bold text-teal-600">7</div>
                <div className="text-sm text-gray-500">Periods</div>
              </div>
              <div className="bg-white rounded-xl shadow-md px-6 py-4">
                <div className="text-3xl font-bold text-green-600">18</div>
                <div className="text-sm text-gray-500">Groups</div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Legend */}
        <section className="px-4 mb-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Element Categories</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className={`px-4 py-2 rounded-full ${cat.bgColor} ${cat.color} text-sm font-medium transition-all`}
                >
                  {cat.name} ({cat.count})
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Elements by Category */}
        <main className="max-w-7xl mx-auto px-4 pb-16">
          {CATEGORIES.map((category) => {
            const elements = groupedElements[category.id] || []
            if (elements.length === 0) return null

            return (
              <section key={category.id} id={category.id} className="mb-12 scroll-mt-24">
                <h2 className={`text-2xl font-bold mb-4 ${category.color}`}>
                  {category.name}
                  <span className="text-gray-400 text-lg font-normal ml-2">
                    ({elements.length} element{elements.length !== 1 ? 's' : ''})
                  </span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {elements.map((element) => {
                    const style = getCategoryStyle(element.category)
                    return (
                      <Link
                        key={element.symbol}
                        href={`/elements/${element.symbol.toLowerCase()}`}
                        className={`${style.bg} ${style.text} rounded-lg p-3 text-center transition-all hover:scale-105 hover:shadow-lg border-2 ${style.border}`}
                      >
                        <div className="text-xs opacity-75">{element.atomicNumber}</div>
                        <div className="text-2xl font-bold">{element.symbol}</div>
                        <div className="text-xs truncate">{element.name}</div>
                        <div className="text-[10px] opacity-75 mt-1">
                          {element.atomicMass.toFixed(2)}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </main>

        {/* Quick Links */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Links</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/tools/periodic-table"
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-2">🔬</div>
                <h3 className="text-lg font-semibold text-gray-800">Interactive Periodic Table</h3>
                <p className="text-gray-600 text-sm mt-2">
                  Explore elements with our interactive periodic table tool
                </p>
              </Link>

              <Link
                href="/compounds"
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-2">🧪</div>
                <h3 className="text-lg font-semibold text-gray-800">Compound Database</h3>
                <p className="text-gray-600 text-sm mt-2">
                  Browse 1,300+ chemical compounds with detailed properties
                </p>
              </Link>

              <Link
                href="/tools/molar-mass"
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-2">⚖️</div>
                <h3 className="text-lg font-semibold text-gray-800">Molar Mass Calculator</h3>
                <p className="text-gray-600 text-sm mt-2">
                  Calculate molar mass for any chemical formula
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 px-4 bg-white">
          <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
            <p>Data sourced from NIST and IUPAC (2021)</p>
            <p className="mt-2">
              © 2025 VerChem. All 118 elements with verified atomic data.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
