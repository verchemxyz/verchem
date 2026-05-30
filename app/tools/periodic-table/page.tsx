'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Atom, Search, Sparkles, Zap, BookOpen, FlaskConical } from 'lucide-react'
import { PeriodicTableSchema } from '@/components/seo/JsonLd'
import { CalcShell, Card, SectionTitle } from '@/components/lab'

interface Element {
  atomicNumber: number
  symbol: string
  name: string
  atomicMass: number
  category: string
  group: number | null
  period: number
  electronConfiguration: string
  electronegativity: number | null
}

// Sample elements for demo (full data in actual app)
const ELEMENTS: Element[] = [
  { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, category: 'nonmetal', group: 1, period: 1, electronConfiguration: '1s¹', electronegativity: 2.20 },
  { atomicNumber: 2, symbol: 'He', name: 'Helium', atomicMass: 4.003, category: 'noble-gas', group: 18, period: 1, electronConfiguration: '1s²', electronegativity: null },
  { atomicNumber: 3, symbol: 'Li', name: 'Lithium', atomicMass: 6.941, category: 'alkali-metal', group: 1, period: 2, electronConfiguration: '[He] 2s¹', electronegativity: 0.98 },
  { atomicNumber: 6, symbol: 'C', name: 'Carbon', atomicMass: 12.011, category: 'nonmetal', group: 14, period: 2, electronConfiguration: '[He] 2s² 2p²', electronegativity: 2.55 },
  { atomicNumber: 7, symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, category: 'nonmetal', group: 15, period: 2, electronConfiguration: '[He] 2s² 2p³', electronegativity: 3.04 },
  { atomicNumber: 8, symbol: 'O', name: 'Oxygen', atomicMass: 15.999, category: 'nonmetal', group: 16, period: 2, electronConfiguration: '[He] 2s² 2p⁴', electronegativity: 3.44 },
  { atomicNumber: 11, symbol: 'Na', name: 'Sodium', atomicMass: 22.990, category: 'alkali-metal', group: 1, period: 3, electronConfiguration: '[Ne] 3s¹', electronegativity: 0.93 },
  { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium', atomicMass: 24.305, category: 'alkaline-earth', group: 2, period: 3, electronConfiguration: '[Ne] 3s²', electronegativity: 1.31 },
  { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine', atomicMass: 35.453, category: 'halogen', group: 17, period: 3, electronConfiguration: '[Ne] 3s² 3p⁵', electronegativity: 3.16 },
  { atomicNumber: 26, symbol: 'Fe', name: 'Iron', atomicMass: 55.845, category: 'transition-metal', group: 8, period: 4, electronConfiguration: '[Ar] 3d⁶ 4s²', electronegativity: 1.83 },
  { atomicNumber: 29, symbol: 'Cu', name: 'Copper', atomicMass: 63.546, category: 'transition-metal', group: 11, period: 4, electronConfiguration: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.90 },
  { atomicNumber: 79, symbol: 'Au', name: 'Gold', atomicMass: 196.967, category: 'transition-metal', group: 11, period: 6, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronegativity: 2.54 },
]

// Element-category → design-system element tokens (chemistry-semantic colors,
// NOT brand chrome). Full literal class strings for Tailwind's content scanner.
const CATEGORY_TOKEN: Record<string, { solid: string; swatch: string }> = {
  'alkali-metal': { solid: 'bg-element-alkali', swatch: 'bg-element-alkali' },
  'alkaline-earth': { solid: 'bg-element-alkaline', swatch: 'bg-element-alkaline' },
  'transition-metal': { solid: 'bg-element-transition', swatch: 'bg-element-transition' },
  'post-transition': { solid: 'bg-element-metals', swatch: 'bg-element-metals' },
  'metalloid': { solid: 'bg-element-metalloids', swatch: 'bg-element-metalloids' },
  'nonmetal': { solid: 'bg-element-nonmetals', swatch: 'bg-element-nonmetals' },
  'halogen': { solid: 'bg-element-halogens', swatch: 'bg-element-halogens' },
  'noble-gas': { solid: 'bg-element-noble-gases', swatch: 'bg-element-noble-gases' },
  'lanthanide': { solid: 'bg-element-lanthanides', swatch: 'bg-element-lanthanides' },
  'actinide': { solid: 'bg-element-actinides', swatch: 'bg-element-actinides' },
}

const CATEGORIES = [
  { id: 'alkali-metal', name: 'Alkali Metal' },
  { id: 'alkaline-earth', name: 'Alkaline Earth' },
  { id: 'transition-metal', name: 'Transition Metal' },
  { id: 'post-transition', name: 'Post-Transition' },
  { id: 'metalloid', name: 'Metalloid' },
  { id: 'nonmetal', name: 'Nonmetal' },
  { id: 'halogen', name: 'Halogen' },
  { id: 'noble-gas', name: 'Noble Gas' },
  { id: 'lanthanide', name: 'Lanthanide' },
  { id: 'actinide', name: 'Actinide' },
]

const FEATURES = [
  {
    icon: Atom,
    title: '118 Elements',
    description: 'Complete periodic table with all discovered elements including superheavies'
  },
  {
    icon: Sparkles,
    title: 'NIST/IUPAC Data',
    description: 'Certified atomic masses and properties from official sources'
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Find elements by name, symbol, or atomic number instantly'
  },
  {
    icon: FlaskConical,
    title: 'Rich Properties',
    description: 'Electron configuration, electronegativity, oxidation states, and more'
  },
  {
    icon: BookOpen,
    title: 'Educational',
    description: 'Perfect for students learning chemistry concepts'
  },
  {
    icon: Zap,
    title: 'Interactive',
    description: 'Click any element for detailed information'
  }
]

function getCategorySolid(category: string): string {
  return CATEGORY_TOKEN[category]?.solid ?? 'bg-muted'
}

export default function PeriodicTablePage() {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredElements = ELEMENTS.filter(el =>
    el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    el.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    el.atomicNumber.toString().includes(searchTerm)
  )

  return (
    <>
      <PeriodicTableSchema />
      <CalcShell
        eyebrow="NIST/IUPAC certified data"
        title="Interactive Periodic Table"
        subtitle="Explore all 118 elements with detailed properties, electron configurations, and more. The most comprehensive free periodic table online."
        backHref="/tools"
        backLabel="All tools"
        maxWidth="6xl"
      >
        {/* Capability strip */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> 118 Elements
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> NIST Certified
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Interactive
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> 100% Free
          </span>
        </div>

        {/* Search & Preview */}
        <Card className="p-6 sm:p-8">
          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search elements by name, symbol, or atomic number..."
                aria-label="Search elements"
                className="input-premium w-full pl-12"
              />
            </div>
          </div>

          {/* Element Grid Preview */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-8">
            {filteredElements.map((el) => (
              <button
                key={el.atomicNumber}
                onClick={() => setSelectedElement(el)}
                className={`group relative rounded-md p-3 text-center transition-colors ${getCategorySolid(el.category)} ${
                  selectedElement?.atomicNumber === el.atomicNumber ? 'ring-2 ring-foreground' : ''
                }`}
              >
                <p className="text-[10px] text-white/80">{el.atomicNumber}</p>
                <p className="text-2xl font-bold text-white">{el.symbol}</p>
                <p className="text-[10px] text-white/80 truncate">{el.name}</p>
              </button>
            ))}
          </div>

          {/* Selected Element Details */}
          {selectedElement && (
            <div className="rounded-lg border border-border bg-muted p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className={`w-32 h-32 rounded-lg ${getCategorySolid(selectedElement.category)} flex flex-col items-center justify-center flex-shrink-0`}>
                  <p className="text-white/80 text-sm">{selectedElement.atomicNumber}</p>
                  <p className="text-5xl font-bold text-white">{selectedElement.symbol}</p>
                  <p className="text-white/80 text-sm">{selectedElement.atomicMass.toFixed(3)}</p>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Name</p>
                    <p className="text-foreground font-semibold">{selectedElement.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Category</p>
                    <p className="text-foreground font-semibold capitalize">{selectedElement.category.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Atomic Mass</p>
                    <p className="text-foreground font-semibold">{selectedElement.atomicMass} u</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Group</p>
                    <p className="text-foreground font-semibold">{selectedElement.group || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Period</p>
                    <p className="text-foreground font-semibold">{selectedElement.period}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Electronegativity</p>
                    <p className="text-foreground font-semibold">{selectedElement.electronegativity || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-muted-foreground text-sm">Electron Configuration</p>
                    <p className="text-foreground font-semibold font-mono">{selectedElement.electronConfiguration}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CTA to full table */}
          <div className="mt-8 text-center">
            <Link
              href="/periodic-table"
              className="inline-flex items-center justify-center gap-2 rounded-md font-medium px-8 py-3 min-h-[44px] bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors"
            >
              View Full Interactive Periodic Table
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="text-muted-foreground mt-3 text-sm">
              All 118 elements with complete properties
            </p>
          </div>
        </Card>

        {/* Category Legend */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Element Categories
          </SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 rounded-full bg-muted border border-border px-4 py-2">
                <div className={`w-4 h-4 rounded ${CATEGORY_TOKEN[cat.id]?.swatch ?? 'bg-muted'}`} />
                <span className="text-sm text-foreground">{cat.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Why Use Our Periodic Table?
          </SectionTitle>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-muted p-6"
              >
                <feature.icon className="h-8 w-8 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Element Highlights */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">
            Featured Elements
          </SectionTitle>
          <p className="text-muted-foreground text-center mb-8">
            Some of the most important elements in chemistry
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { symbol: 'H', name: 'Hydrogen', fact: 'Most abundant element in the universe', category: 'nonmetal' },
              { symbol: 'C', name: 'Carbon', fact: 'Basis of all organic chemistry', category: 'nonmetal' },
              { symbol: 'Fe', name: 'Iron', fact: 'Most used metal on Earth', category: 'transition-metal' },
              { symbol: 'Au', name: 'Gold', fact: 'One of the least reactive elements', category: 'transition-metal' },
            ].map((el) => (
              <div
                key={el.symbol}
                className="rounded-lg border border-border bg-muted p-6 text-center"
              >
                <div className={`w-20 h-20 rounded-lg ${getCategorySolid(el.category)} flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-3xl font-bold text-white">{el.symbol}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{el.name}</h3>
                <p className="text-muted-foreground text-sm">{el.fact}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Frequently Asked Questions
          </SectionTitle>

          <div className="space-y-6">
            {[
              {
                q: 'How is the periodic table organized?',
                a: 'Elements are arranged by increasing atomic number (number of protons). Rows are called periods and columns are called groups. Elements in the same group have similar chemical properties because they have the same number of valence electrons.'
              },
              {
                q: 'What data sources do you use?',
                a: 'Our periodic table uses official NIST (National Institute of Standards and Technology) and IUPAC (International Union of Pure and Applied Chemistry) certified data for atomic masses and other properties.'
              },
              {
                q: 'How many elements are there?',
                a: 'There are 118 confirmed elements. Elements 1-94 occur naturally, while 95-118 are synthetic. The latest additions (113-118) were confirmed by IUPAC in 2016.'
              },
              {
                q: 'What are the element categories?',
                a: 'Elements are categorized into: alkali metals, alkaline earth metals, transition metals, post-transition metals, metalloids, nonmetals, halogens, noble gases, lanthanides, and actinides.'
              },
              {
                q: 'Can I use this for schoolwork?',
                a: 'Absolutely! Our periodic table is perfect for students. It includes all the information typically needed for chemistry classes, with NIST-certified accuracy for homework and exams.'
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-3">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-6 sm:p-8 text-center">
          <SectionTitle className="text-2xl mb-6">
            Explore More Chemistry Tools
          </SectionTitle>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tools/equation-balancer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Equation Balancer
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/molar-mass"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Molar Mass
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Stoichiometry
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/ph-calculator"
              className="inline-flex items-center justify-center gap-2 rounded-md font-medium px-6 py-3 min-h-[44px] bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors"
            >
              pH Calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </CalcShell>
    </>
  )
}
