'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Atom, Search, Sparkles, Zap, BookOpen, FlaskConical } from 'lucide-react'
import { PeriodicTableSchema } from '@/components/seo/JsonLd'

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

const CATEGORIES = [
  { id: 'alkali-metal', name: 'Alkali Metal', color: 'bg-red-500/80' },
  { id: 'alkaline-earth', name: 'Alkaline Earth', color: 'bg-orange-500/80' },
  { id: 'transition-metal', name: 'Transition Metal', color: 'bg-yellow-500/80' },
  { id: 'post-transition', name: 'Post-Transition', color: 'bg-green-500/80' },
  { id: 'metalloid', name: 'Metalloid', color: 'bg-teal-500/80' },
  { id: 'nonmetal', name: 'Nonmetal', color: 'bg-cyan-500/80' },
  { id: 'halogen', name: 'Halogen', color: 'bg-blue-500/80' },
  { id: 'noble-gas', name: 'Noble Gas', color: 'bg-purple-500/80' },
  { id: 'lanthanide', name: 'Lanthanide', color: 'bg-pink-500/80' },
  { id: 'actinide', name: 'Actinide', color: 'bg-rose-500/80' },
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

function getCategoryColor(category: string): string {
  switch (category) {
    case 'alkali-metal': return 'from-red-600 to-red-500'
    case 'alkaline-earth': return 'from-orange-600 to-orange-500'
    case 'transition-metal': return 'from-yellow-600 to-yellow-500'
    case 'nonmetal': return 'from-cyan-600 to-cyan-500'
    case 'halogen': return 'from-blue-600 to-blue-500'
    case 'noble-gas': return 'from-purple-600 to-purple-500'
    default: return 'from-slate-600 to-slate-500'
  }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300 mb-6">
              <Atom className="h-4 w-4" />
              NIST/IUPAC Certified Data
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Interactive
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Periodic Table
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Explore all 118 elements with detailed properties, electron configurations,
              and more. The most comprehensive free periodic table online.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                118 Elements
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                NIST Certified
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Interactive
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                100% Free
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Preview */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 to-indigo-900/20 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm">
            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search elements by name, symbol, or atomic number..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Element Grid Preview */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-8">
              {filteredElements.map((el) => (
                <button
                  key={el.atomicNumber}
                  onClick={() => setSelectedElement(el)}
                  className={`group relative rounded-xl p-3 text-center transition-all hover:scale-105 bg-gradient-to-br ${getCategoryColor(el.category)} ${
                    selectedElement?.atomicNumber === el.atomicNumber ? 'ring-2 ring-white' : ''
                  }`}
                >
                  <p className="text-[10px] text-white/70">{el.atomicNumber}</p>
                  <p className="text-2xl font-bold text-white">{el.symbol}</p>
                  <p className="text-[10px] text-white/70 truncate">{el.name}</p>
                </button>
              ))}
            </div>

            {/* Selected Element Details */}
            {selectedElement && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${getCategoryColor(selectedElement.category)} flex flex-col items-center justify-center flex-shrink-0`}>
                    <p className="text-white/70 text-sm">{selectedElement.atomicNumber}</p>
                    <p className="text-5xl font-bold text-white">{selectedElement.symbol}</p>
                    <p className="text-white/70 text-sm">{selectedElement.atomicMass.toFixed(3)}</p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Name</p>
                      <p className="text-white font-semibold">{selectedElement.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Category</p>
                      <p className="text-white font-semibold capitalize">{selectedElement.category.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Atomic Mass</p>
                      <p className="text-white font-semibold">{selectedElement.atomicMass} u</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Group</p>
                      <p className="text-white font-semibold">{selectedElement.group || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Period</p>
                      <p className="text-white font-semibold">{selectedElement.period}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Electronegativity</p>
                      <p className="text-white font-semibold">{selectedElement.electronegativity || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-slate-400 text-sm">Electron Configuration</p>
                      <p className="text-white font-semibold font-mono">{selectedElement.electronConfiguration}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA to full table */}
            <div className="mt-8 text-center">
              <Link
                href="/periodic-table"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 font-semibold text-white transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                View Full Interactive Periodic Table
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-slate-400 mt-3 text-sm">
                All 118 elements with complete properties
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Legend */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Element Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
                <div className={`w-4 h-4 rounded ${cat.color}`} />
                <span className="text-sm text-slate-300">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Use Our Periodic Table?
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-indigo-500/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Element Highlights */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Featured Elements
          </h2>
          <p className="text-slate-400 text-center mb-12">
            Some of the most important elements in chemistry
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { symbol: 'H', name: 'Hydrogen', fact: 'Most abundant element in the universe', color: 'from-cyan-600 to-cyan-500' },
              { symbol: 'C', name: 'Carbon', fact: 'Basis of all organic chemistry', color: 'from-cyan-600 to-cyan-500' },
              { symbol: 'Fe', name: 'Iron', fact: 'Most used metal on Earth', color: 'from-yellow-600 to-yellow-500' },
              { symbol: 'Au', name: 'Gold', fact: 'One of the least reactive elements', color: 'from-yellow-600 to-yellow-500' },
            ].map((el) => (
              <div
                key={el.symbol}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${el.color} flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-3xl font-bold text-white">{el.symbol}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{el.name}</h3>
                <p className="text-slate-400 text-sm">{el.fact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

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
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Explore More Chemistry Tools
          </h2>
          <p className="text-slate-400 mb-8">
            VerChem offers a complete suite of chemistry calculators
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tools/equation-balancer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Equation Balancer
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/molar-mass"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Molar Mass
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Stoichiometry
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/ph-calculator"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-medium text-white hover:from-indigo-500 hover:to-violet-500 transition-colors"
            >
              pH Calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
