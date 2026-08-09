'use client'

// VerChem - Compound Database Page
// Comprehensive chemical compound database backed by the canonical dataset

import { useState } from 'react'
import Link from 'next/link'
import { CalcShell, Card, SectionTitle, Button } from '@/components/lab'
import CompoundBrowser from '@/components/compound-browser'
import { Compound } from '@/lib/types/chemistry'
import { COMPOUND_STATISTICS } from '@/lib/data/compounds'
import { hasApplicableMolarMass } from '@/lib/data/compounds/types'
import { serializeCsv } from '@/lib/csv'

export default function CompoundsPage() {
  const [selectedCompounds, setSelectedCompounds] = useState<Compound[]>([])

  const handleCompoundSelect = (compound: Compound) => {
    // Toggle selection
    const isSelected = selectedCompounds.some(c => c.id === compound.id)
    if (isSelected) {
      setSelectedCompounds(selectedCompounds.filter(c => c.id !== compound.id))
    } else {
      setSelectedCompounds([...selectedCompounds, compound])
    }
  }

  const clearSelection = () => {
    setSelectedCompounds([])
  }

  const exportSelection = (format: 'json' | 'csv') => {
    const data = selectedCompounds.map(compound => ({
      id: compound.id,
      name: compound.name,
      formula: compound.formula,
      molecularMass: hasApplicableMolarMass(compound) ? compound.molarMass : null,
      molarMassBasis: compound.molarMassBasis,
      cas: compound.cas,
      meltingPoint: compound.meltingPoint,
      boilingPoint: compound.boilingPoint,
      density: compound.density,
      uses: compound.uses
    }))

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'selected-compounds.json'
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      const headers = ['ID', 'Name', 'Formula', 'Molar Mass (g/mol)', 'Molar Mass Basis', 'CAS', 'Melting Point', 'Boiling Point', 'Density', 'Uses']
      const rows = data.map(compound => [
        compound.id,
        compound.name,
        compound.formula,
        compound.molecularMass ?? '',
        compound.molarMassBasis ?? '',
        compound.cas || '',
        compound.meltingPoint || '',
        compound.boilingPoint || '',
        compound.density || '',
        compound.uses?.join(';') || ''
      ])
      const csv = serializeCsv([headers, ...rows])

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'selected-compounds.csv'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const FEATURES = [
    {
      title: 'Advanced Search',
      body: 'Search by name, formula, properties, hazards, applications, and more. Filter by molecular mass, physical properties, and functional groups.',
    },
    {
      title: 'Per-record Coverage',
      body: 'Every record has an identity and formula representation. Physical properties, solubility, uses, CAS identifiers, structures, and safety fields are shown only where curated for that record.',
    },
    {
      title: 'Calculator Integration',
      body: 'Formula-based molar-mass and stoichiometry workflows are available only for fixed-formula or reviewed repeat-unit records. Variable-composition materials and mixture averages are excluded from formula parsing.',
    },
    {
      title: 'Diverse Categories',
      body: 'Organic compounds, inorganic compounds, biochemicals, pharmaceuticals, industrial chemicals, polymers, and materials science.',
    },
    {
      title: 'Safety Focus',
      body: 'Curated GHS pictograms and hazard statements are displayed when present. This reference does not replace a supplier SDS or an approved laboratory protocol.',
    },
    {
      title: 'Educational Resources',
      body: 'Curated compound sets for different educational levels, from basic chemistry to advanced materials science.',
    },
  ]

  return (
    <CalcShell
      eyebrow="Reference · Compound database"
      title="Chemical Compound Database"
      subtitle={`Comprehensive database of ${COMPOUND_STATISTICS.totalCompounds.toLocaleString('en-US')} chemical compounds with advanced search, filtering, and calculator integration.`}
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: COMPOUND_STATISTICS.totalCompounds.toLocaleString('en-US'), label: 'Total Compounds' },
          { value: Object.keys(COMPOUND_STATISTICS.categories).length.toLocaleString('en-US'), label: 'Source Groups' },
          { value: 'Per record', label: 'Field Coverage' },
          { value: 'CSV / JSON', label: 'Export Formats' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 text-center">
            <div className="text-2xl font-bold font-mono text-primary-600">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Selection Controls */}
      {selectedCompounds.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-foreground">
              <span className="font-semibold">{selectedCompounds.length}</span> compounds selected
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => exportSelection('json')} className="px-4 py-2 text-sm">
                Export JSON
              </Button>
              <Button onClick={() => exportSelection('csv')} className="px-4 py-2 text-sm">
                Export CSV
              </Button>
              <Button variant="secondary" onClick={clearSelection} className="px-4 py-2 text-sm">
                Clear Selection
              </Button>
            </div>
          </div>

          {/* Selected Compounds Preview */}
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCompounds.slice(0, 10).map(compound => (
              <span key={compound.id} className="px-2 py-1 bg-primary-500/10 text-primary-700 rounded text-sm">
                {compound.name} ({compound.formula})
              </span>
            ))}
            {selectedCompounds.length > 10 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-sm">
                +{selectedCompounds.length - 10} more
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Integration Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/stoichiometry" className="group block h-full">
          <Card className="p-6 h-full transition-colors hover:border-primary-500">
            <h3 className="font-semibold text-foreground group-hover:text-primary-600">Stoichiometry</h3>
            <p className="text-sm text-muted-foreground">Molecular mass calculations with compound data</p>
          </Card>
        </Link>

        <Link href="/thermodynamics" className="group block h-full">
          <Card className="p-6 h-full transition-colors hover:border-primary-500">
            <h3 className="font-semibold text-foreground group-hover:text-primary-600">Thermodynamics</h3>
            <p className="text-sm text-muted-foreground">Thermodynamic properties and calculations</p>
          </Card>
        </Link>

        <Link href="/solutions" className="group block h-full">
          <Card className="p-6 h-full transition-colors hover:border-primary-500">
            <h3 className="font-semibold text-foreground group-hover:text-primary-600">Solutions</h3>
            <p className="text-sm text-muted-foreground">Solubility and solution chemistry</p>
          </Card>
        </Link>

        <Card className="p-6 h-full">
          <h3 className="font-semibold text-foreground">3D Viewer</h3>
          <p className="text-sm text-muted-foreground">Molecular structure visualization</p>
        </Card>
      </div>

      {/* Compound Browser */}
      <Card className="p-6">
        <CompoundBrowser
          onCompoundSelect={handleCompoundSelect}
          selectedCompounds={selectedCompounds}
          mode="select"
        />
      </Card>

      {/* Database Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map(feature => (
          <Card key={feature.title} className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.body}</p>
          </Card>
        ))}
      </div>

      {/* Technical Specifications */}
      <Card className="p-6">
        <SectionTitle className="mb-4 text-2xl">Technical specifications</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Reference Basis</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Formula masses use the project&apos;s IUPAC 2021 standard atomic weights.</li>
              <li>• Selected element and physical-property references cite NIST and CRC sources.</li>
              <li>• VerChem cites these publications; it is not certified by those organizations.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Data Coverage</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Identity and formula representation are present for every record.</li>
              <li>• Molar mass is omitted for variable-composition records.</li>
              <li>• MP, BP, density, solubility, CAS, uses, GHS and SMILES coverage varies.</li>
              <li>• Missing fields are left unavailable rather than filled with inferred values.</li>
            </ul>
          </div>
        </div>
      </Card>
    </CalcShell>
  )
}
