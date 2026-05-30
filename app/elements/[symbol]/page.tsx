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

// Category color is SEMANTIC (encodes element category). Mapped to the
// --element-* tokens as a tinted surface + token text + token border —
// matching ElementModal/PeriodicTableGrid and AA-safe in both themes.
function getCategoryStyle(category: ElementCategory): string {
  const styles: Record<ElementCategory, string> = {
    'alkali-metal': 'bg-element-alkali/15 text-element-alkali border border-element-alkali/50',
    'alkaline-earth-metal': 'bg-element-alkaline/15 text-element-alkaline border border-element-alkaline/50',
    'transition-metal': 'bg-element-transition/15 text-element-transition border border-element-transition/50',
    'post-transition-metal': 'bg-element-metals/15 text-element-metals border border-element-metals/50',
    'metalloid': 'bg-element-metalloids/15 text-element-metalloids border border-element-metalloids/50',
    'nonmetal': 'bg-element-nonmetals/15 text-element-nonmetals border border-element-nonmetals/50',
    'halogen': 'bg-element-halogens/15 text-element-halogens border border-element-halogens/50',
    'noble-gas': 'bg-element-noble-gases/15 text-element-noble-gases border border-element-noble-gases/50',
    'lanthanide': 'bg-element-lanthanides/15 text-element-lanthanides border border-element-lanthanides/50',
    'actinide': 'bg-element-actinides/15 text-element-actinides border border-element-actinides/50',
    'unknown': 'bg-muted text-muted-foreground border border-border',
  }
  return styles[category] || 'bg-muted text-muted-foreground border border-border'
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

      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-primary-600 hover:text-primary-500 transition-colors">Home</Link></li>
              <li className="text-muted-foreground">/</li>
              <li><Link href="/periodic-table" className="text-primary-600 hover:text-primary-500 transition-colors">Periodic Table</Link></li>
              <li className="text-muted-foreground">/</li>
              <li className="text-foreground">{element.name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="border border-border rounded-lg bg-card p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Element Symbol Card */}
              <div className={`w-40 h-40 ${getCategoryStyle(element.category)} rounded-lg flex flex-col items-center justify-center`}>
                <span className="text-sm font-mono opacity-80">{element.atomicNumber}</span>
                <span className="text-5xl font-bold">{element.symbol}</span>
                <span className="text-sm font-mono mt-1">{element.atomicMass.toFixed(4)}</span>
              </div>

              {/* Element Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {element.name}
                </h1>
                <p className="text-xl text-muted-foreground mb-4">
                  {formatCategory(element.category)}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-muted border border-border text-foreground rounded-full text-sm">
                    Period {element.period}
                  </span>
                  {element.group && (
                    <span className="px-3 py-1 bg-muted border border-border text-foreground rounded-full text-sm">
                      Group {element.group}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-muted border border-border text-foreground rounded-full text-sm">
                    Block {element.block.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 bg-muted border border-border text-foreground rounded-full text-sm capitalize">
                    {element.standardState}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Atomic Properties */}
            <div className="border border-border rounded-lg bg-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Atomic Properties
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Atomic Number</dt>
                  <dd className="font-medium text-foreground font-mono">{element.atomicNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Atomic Mass</dt>
                  <dd className="font-medium text-foreground font-mono">{element.atomicMass.toFixed(4)} amu</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Electron Configuration</dt>
                  <dd className="font-medium text-foreground font-mono text-sm">{element.electronConfiguration}</dd>
                </div>
                {element.electronegativity && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Electronegativity</dt>
                    <dd className="font-medium text-foreground font-mono">{element.electronegativity} (Pauling)</dd>
                  </div>
                )}
                {element.ionizationEnergy && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ionization Energy</dt>
                    <dd className="font-medium text-foreground font-mono">{element.ionizationEnergy} kJ/mol</dd>
                  </div>
                )}
                {element.electronAffinity && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Electron Affinity</dt>
                    <dd className="font-medium text-foreground font-mono">{element.electronAffinity} kJ/mol</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Oxidation States</dt>
                  <dd className="font-medium text-foreground font-mono">
                    {element.oxidationStates.map(s => s > 0 ? `+${s}` : s).join(', ')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Physical Properties */}
            <div className="border border-border rounded-lg bg-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Physical Properties
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Standard State</dt>
                  <dd className="font-medium text-foreground capitalize">{element.standardState}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Melting Point</dt>
                  <dd className="font-medium text-foreground font-mono">{formatTemperature(element.meltingPoint)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Boiling Point</dt>
                  <dd className="font-medium text-foreground font-mono">{formatTemperature(element.boilingPoint)}</dd>
                </div>
                {element.density && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Density</dt>
                    <dd className="font-medium text-foreground font-mono">{element.density} g/cm³</dd>
                  </div>
                )}
                {element.atomicRadius && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Atomic Radius</dt>
                    <dd className="font-medium text-foreground font-mono">{element.atomicRadius} pm</dd>
                  </div>
                )}
                {element.covalentRadius && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Covalent Radius</dt>
                    <dd className="font-medium text-foreground font-mono">{element.covalentRadius} pm</dd>
                  </div>
                )}
                {element.vanDerWaalsRadius && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Van der Waals Radius</dt>
                    <dd className="font-medium text-foreground font-mono">{element.vanDerWaalsRadius} pm</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Discovery Section */}
          {(element.discoveryYear || element.discoverer || element.nameMeaning) && (
            <div className="border border-border rounded-lg bg-card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Discovery & Etymology
              </h2>
              <dl className="space-y-3">
                {element.discoveryYear && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Discovery Year</dt>
                    <dd className="font-medium text-foreground font-mono">{element.discoveryYear}</dd>
                  </div>
                )}
                {element.discoverer && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Discoverer</dt>
                    <dd className="font-medium text-foreground">{element.discoverer}</dd>
                  </div>
                )}
                {element.nameMeaning && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name Origin</dt>
                    <dd className="font-medium text-foreground">{element.nameMeaning}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Related Elements */}
          {relatedElements.length > 0 && (
            <div className="border border-border rounded-lg bg-card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Related Elements
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {relatedElements.map((el) => (
                  <Link
                    key={el.symbol}
                    href={`/elements/${el.symbol.toLowerCase()}`}
                    className={`${getCategoryStyle(el.category)} rounded-lg p-3 text-center transition-opacity hover:opacity-80`}
                  >
                    <span className="text-xs font-mono opacity-80">{el.atomicNumber}</span>
                    <div className="text-xl font-bold">{el.symbol}</div>
                    <span className="text-xs text-foreground truncate block">{el.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tools CTA */}
          <div className="border border-border rounded-lg bg-card p-6 border-l-2 border-l-primary-500">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Explore more chemistry tools</h2>
            <p className="text-muted-foreground mb-4">
              Use our calculators to work with {element.name} in chemical reactions and calculations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/periodic-table"
                className="px-4 py-2 bg-primary-500 text-primary-foreground hover:bg-primary-600 rounded-md font-medium transition-colors"
              >
                Interactive Periodic Table
              </Link>
              <Link
                href="/tools/stoichiometry"
                className="px-4 py-2 border border-border bg-card text-foreground hover:bg-muted rounded-md font-medium transition-colors"
              >
                Stoichiometry Calculator
              </Link>
              <Link
                href="/tools/molar-mass"
                className="px-4 py-2 border border-border bg-card text-foreground hover:bg-muted rounded-md font-medium transition-colors"
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
