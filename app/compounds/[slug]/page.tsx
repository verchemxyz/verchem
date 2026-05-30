import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CalcShell, Card, SectionTitle } from '@/components/lab'
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
    'water-treatment': 'Industrial Chemical',
    'metal': 'Metal',
    'alloy': 'Alloy',
    'ceramic': 'Ceramic',
    'dye': 'Dye',
    'surfactant': 'Surfactant',
    'other': 'Chemical',
  }
  return categoryNames[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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

      <CalcShell
        eyebrow={`Compound · ${formatCategory(compound.category)}`}
        title={compound.name}
        subtitle={compound.nameThai || undefined}
        backHref="/compounds"
        backLabel="Compounds"
        maxWidth="4xl"
      >
        {/* Hero Section */}
        <Card className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Compound Card */}
            <div className="w-32 h-32 bg-muted border border-border rounded-lg flex flex-col items-center justify-center shrink-0">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{compound.physicalState}</span>
              <span className="text-lg font-mono font-bold text-center px-2 text-foreground">{compound.formula}</span>
            </div>

            {/* Compound Info */}
            <div className="flex-1">
              {compound.iupacName && compound.iupacName !== compound.name && (
                <p className="text-sm text-muted-foreground mb-3 italic">
                  IUPAC: {compound.iupacName}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-primary-500/10 text-primary-700 border border-primary-500/30 rounded-full text-sm">
                  {formatCategory(compound.category)}
                </span>
                <span className="px-3 py-1 bg-muted border border-border rounded-full text-sm capitalize text-muted-foreground">
                  {compound.physicalState}
                </span>
                {compound.casNumber && (
                  <span className="px-3 py-1 bg-muted border border-border rounded-full text-sm font-mono text-muted-foreground">
                    CAS: {compound.casNumber}
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold font-mono text-foreground">
                {compound.molarMass.toFixed(4)} <span className="text-base font-normal text-muted-foreground">g/mol</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Properties Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chemical Properties */}
          <Card className="p-6">
            <SectionTitle className="mb-4 text-xl">Chemical Properties</SectionTitle>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Formula</dt>
                <dd className="font-medium text-foreground font-mono">{compound.formula}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Molar Mass</dt>
                <dd className="font-medium text-foreground font-mono">{compound.molarMass.toFixed(4)} g/mol</dd>
              </div>
              {compound.casNumber && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">CAS Number</dt>
                  <dd className="font-medium text-foreground font-mono">{compound.casNumber}</dd>
                </div>
              )}
              {compound.pKa !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">pKa</dt>
                  <dd className="font-medium text-foreground font-mono">{compound.pKa}</dd>
                </div>
              )}
              {compound.pKb !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">pKb</dt>
                  <dd className="font-medium text-foreground font-mono">{compound.pKb}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Physical Properties */}
          <Card className="p-6">
            <SectionTitle className="mb-4 text-xl">Physical Properties</SectionTitle>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Physical State</dt>
                <dd className="font-medium text-foreground capitalize">{compound.physicalState}</dd>
              </div>
              {compound.appearance && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Appearance</dt>
                  <dd className="font-medium text-foreground text-right max-w-[200px]">{compound.appearance}</dd>
                </div>
              )}
              {compound.odor && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Odor</dt>
                  <dd className="font-medium text-foreground">{compound.odor}</dd>
                </div>
              )}
              {compound.meltingPoint !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Melting Point</dt>
                  <dd className="font-medium text-foreground font-mono">{compound.meltingPoint} °C</dd>
                </div>
              )}
              {compound.boilingPoint !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Boiling Point</dt>
                  <dd className="font-medium text-foreground font-mono">{compound.boilingPoint} °C</dd>
                </div>
              )}
              {compound.density !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Density</dt>
                  <dd className="font-medium text-foreground font-mono">{compound.density} g/cm³</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Solubility</dt>
                <dd className="font-medium text-foreground text-right max-w-[200px]">{formatSolubility(compound.solubility)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Safety Section — GHS/hazard colors are semantic, kept via destructive/warning tokens */}
        {(hazardCodes.length > 0 || (compound.ghs && compound.ghs.length > 0)) && (
          <Card className="p-6 border-l-2 border-l-destructive">
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-destructive shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
              </svg>
              Safety Information
            </h2>
            {compound.ghs && compound.ghs.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">GHS Pictograms</h3>
                <div className="flex flex-wrap gap-2">
                  {compound.ghs.map((code) => (
                    <span key={code} className="px-3 py-1 bg-destructive/10 text-destructive border border-destructive/30 rounded-full text-sm font-mono">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {hazardCodes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Hazard Statements</h3>
                <ul className="space-y-2">
                  {hazardCodes.map((code) => (
                    <li key={code} className="flex items-start gap-2">
                      <span className="font-mono text-sm bg-warning/10 text-warning-strong border border-warning/30 px-2 py-0.5 rounded shrink-0">
                        {code}
                      </span>
                      <span className="text-foreground text-sm">
                        {GHS_DESCRIPTIONS[code] || 'Hazardous material'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* Uses Section */}
        {compound.uses && compound.uses.length > 0 && (
          <Card className="p-6">
            <SectionTitle className="mb-4 text-xl">Uses & Applications</SectionTitle>
            <ul className="grid md:grid-cols-2 gap-2">
              {compound.uses.map((use, index) => (
                <li key={index} className="flex items-center gap-2 text-foreground">
                  <svg className="w-4 h-4 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {use}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Related Compounds */}
        {relatedCompounds.length > 0 && (
          <Card className="p-6">
            <SectionTitle className="mb-4 text-xl">Related Compounds</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {relatedCompounds.map((c) => (
                <Link
                  key={c.id}
                  href={`/compounds/${c.id}`}
                  className="p-3 bg-muted border border-border rounded-md hover:border-primary-500 transition-colors"
                >
                  <div className="font-mono text-sm text-muted-foreground">{c.formula}</div>
                  <div className="font-medium text-foreground truncate">{c.name}</div>
                  {c.nameThai && (
                    <div className="text-xs text-muted-foreground truncate">{c.nameThai}</div>
                  )}
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Tools CTA */}
        <Card className="p-6">
          <SectionTitle className="mb-2 text-xl">Calculate with {compound.name}</SectionTitle>
          <p className="text-muted-foreground mb-4">
            Use our chemistry calculators to work with {compound.formula} in reactions and solutions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/molar-mass"
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              Molar Mass Calculator
            </Link>
            <Link
              href="/tools/stoichiometry"
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              Stoichiometry Calculator
            </Link>
            <Link
              href="/tools/ph-calculator"
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              pH Calculator
            </Link>
            <Link
              href="/compounds"
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              Browse All Compounds
            </Link>
          </div>
        </Card>
      </CalcShell>
    </>
  )
}
