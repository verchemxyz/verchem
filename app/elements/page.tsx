import { Metadata } from 'next'
import Link from 'next/link'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'
import { ElementCategory } from '@/lib/types/chemistry'
import { CalcShell, Card, SectionTitle } from '@/components/lab'

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

// Element categories with display info.
// Colors are SEMANTIC (encode element category) → mapped to the --element-*
// tokens (text + tinted surface + border), matching ElementModal/PeriodicTableGrid.
const CATEGORIES: { id: ElementCategory; name: string; chip: string; count: number }[] = [
  { id: 'alkali-metal', name: 'Alkali Metals', chip: 'bg-element-alkali/15 text-foreground border border-element-alkali/40 hover:bg-element-alkali/25', count: 6 },
  { id: 'alkaline-earth-metal', name: 'Alkaline Earth Metals', chip: 'bg-element-alkaline/15 text-foreground border border-element-alkaline/40 hover:bg-element-alkaline/25', count: 6 },
  { id: 'transition-metal', name: 'Transition Metals', chip: 'bg-element-transition/15 text-foreground border border-element-transition/40 hover:bg-element-transition/25', count: 38 },
  { id: 'post-transition-metal', name: 'Post-Transition Metals', chip: 'bg-element-metals/15 text-foreground border border-element-metals/40 hover:bg-element-metals/25', count: 7 },
  { id: 'metalloid', name: 'Metalloids', chip: 'bg-element-metalloids/15 text-foreground border border-element-metalloids/40 hover:bg-element-metalloids/25', count: 7 },
  { id: 'nonmetal', name: 'Nonmetals', chip: 'bg-element-nonmetals/15 text-foreground border border-element-nonmetals/40 hover:bg-element-nonmetals/25', count: 7 },
  { id: 'halogen', name: 'Halogens', chip: 'bg-element-halogens/15 text-foreground border border-element-halogens/40 hover:bg-element-halogens/25', count: 5 },
  { id: 'noble-gas', name: 'Noble Gases', chip: 'bg-element-noble-gases/15 text-foreground border border-element-noble-gases/40 hover:bg-element-noble-gases/25', count: 7 },
  { id: 'lanthanide', name: 'Lanthanides', chip: 'bg-element-lanthanides/15 text-foreground border border-element-lanthanides/40 hover:bg-element-lanthanides/25', count: 15 },
  { id: 'actinide', name: 'Actinides', chip: 'bg-element-actinides/15 text-foreground border border-element-actinides/40 hover:bg-element-actinides/25', count: 15 },
  { id: 'unknown', name: 'Unknown Properties', chip: 'bg-muted text-muted-foreground border border-border hover:bg-accent', count: 5 },
]

// Per-element tile style by category (semantic — --element-* tokens).
// Tinted token surface + token text + token border, matching the rest of the app.
function getCategoryStyle(category: ElementCategory): { bg: string; text: string; border: string } {
  const styles: Record<ElementCategory, { bg: string; text: string; border: string }> = {
    'alkali-metal': { bg: 'bg-element-alkali/15 hover:bg-element-alkali/25', text: 'text-foreground', border: 'border-element-alkali/50' },
    'alkaline-earth-metal': { bg: 'bg-element-alkaline/15 hover:bg-element-alkaline/25', text: 'text-foreground', border: 'border-element-alkaline/50' },
    'transition-metal': { bg: 'bg-element-transition/15 hover:bg-element-transition/25', text: 'text-foreground', border: 'border-element-transition/50' },
    'post-transition-metal': { bg: 'bg-element-metals/15 hover:bg-element-metals/25', text: 'text-foreground', border: 'border-element-metals/50' },
    'metalloid': { bg: 'bg-element-metalloids/15 hover:bg-element-metalloids/25', text: 'text-foreground', border: 'border-element-metalloids/50' },
    'nonmetal': { bg: 'bg-element-nonmetals/15 hover:bg-element-nonmetals/25', text: 'text-foreground', border: 'border-element-nonmetals/50' },
    'halogen': { bg: 'bg-element-halogens/15 hover:bg-element-halogens/25', text: 'text-foreground', border: 'border-element-halogens/50' },
    'noble-gas': { bg: 'bg-element-noble-gases/15 hover:bg-element-noble-gases/25', text: 'text-foreground', border: 'border-element-noble-gases/50' },
    'lanthanide': { bg: 'bg-element-lanthanides/15 hover:bg-element-lanthanides/25', text: 'text-foreground', border: 'border-element-lanthanides/50' },
    'actinide': { bg: 'bg-element-actinides/15 hover:bg-element-actinides/25', text: 'text-foreground', border: 'border-element-actinides/50' },
    'unknown': { bg: 'bg-muted hover:bg-accent', text: 'text-muted-foreground', border: 'border-border' },
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

      <CalcShell
        eyebrow="Reference data · 118 elements · NIST/IUPAC 2021"
        title="Periodic Table of Elements"
        subtitle="Explore all 118 chemical elements with detailed atomic properties, electron configurations, and physical data. Click any element to learn more."
        backHref="/"
        backLabel="Home"
        maxWidth="7xl"
        action={
          <Link
            href="/tools/periodic-table"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
          >
            Interactive Periodic Table →
          </Link>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="px-6 py-4 text-center">
            <div className="text-3xl font-bold font-mono text-primary-600">118</div>
            <div className="text-sm text-muted-foreground">Elements</div>
          </Card>
          <Card className="px-6 py-4 text-center">
            <div className="text-3xl font-bold font-mono text-primary-600">11</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </Card>
          <Card className="px-6 py-4 text-center">
            <div className="text-3xl font-bold font-mono text-primary-600">7</div>
            <div className="text-sm text-muted-foreground">Periods</div>
          </Card>
          <Card className="px-6 py-4 text-center">
            <div className="text-3xl font-bold font-mono text-primary-600">18</div>
            <div className="text-sm text-muted-foreground">Groups</div>
          </Card>
        </div>

        {/* Category Legend */}
        <Card className="p-6">
          <SectionTitle className="mb-4 text-center">Element categories</SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className={`px-4 py-2 rounded-full ${cat.chip} text-sm font-medium transition-colors`}
              >
                {cat.name} ({cat.count})
              </a>
            ))}
          </div>
        </Card>

        {/* Elements by Category */}
        <div>
          {CATEGORIES.map((category) => {
            const elements = groupedElements[category.id] || []
            if (elements.length === 0) return null

            const headingStyle = getCategoryStyle(category.id)
            return (
              <section key={category.id} id={category.id} className="mb-12 scroll-mt-24">
                <h2 className={`text-2xl font-bold mb-4 ${headingStyle.text}`}>
                  {category.name}
                  <span className="text-muted-foreground text-lg font-normal ml-2">
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
                        className={`${style.bg} ${style.text} rounded-lg p-3 text-center transition-colors border ${style.border}`}
                      >
                        <div className="text-xs text-foreground font-mono">{element.atomicNumber}</div>
                        <div className="text-2xl font-bold text-foreground">{element.symbol}</div>
                        <div className="text-xs text-foreground truncate">{element.name}</div>
                        <div className="text-[10px] text-foreground font-mono mt-1">
                          {element.atomicMass.toFixed(2)}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* Quick Links */}
        <Card className="p-6">
          <SectionTitle className="mb-6 text-center">Quick links</SectionTitle>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/tools/periodic-table"
              className="border border-border rounded-lg bg-muted p-6 hover:border-primary-500/40 hover:bg-accent transition-colors"
            >
              <h3 className="text-lg font-semibold text-foreground">Interactive Periodic Table</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Explore elements with our interactive periodic table tool
              </p>
            </Link>

            <Link
              href="/compounds"
              className="border border-border rounded-lg bg-muted p-6 hover:border-primary-500/40 hover:bg-accent transition-colors"
            >
              <h3 className="text-lg font-semibold text-foreground">Compound Database</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Browse 1,300+ chemical compounds with detailed properties
              </p>
            </Link>

            <Link
              href="/tools/molar-mass"
              className="border border-border rounded-lg bg-muted p-6 hover:border-primary-500/40 hover:bg-accent transition-colors"
            >
              <h3 className="text-lg font-semibold text-foreground">Molar Mass Calculator</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Calculate molar mass for any chemical formula
              </p>
            </Link>
          </div>
        </Card>

        {/* Footnote */}
        <p className="text-center text-xs text-muted-foreground">
          Data sourced from NIST and IUPAC (2021). All 118 elements with verified atomic data.
        </p>
      </CalcShell>
    </>
  )
}
