import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FUNCTIONAL_GROUPS } from '@/lib/data/organic/functional-groups'
import { NAMED_REACTIONS, REACTION_STATISTICS } from '@/lib/data/organic/named-reactions'

export const metadata: Metadata = {
  title: 'Organic Chemistry Tools | VerChem',
  description:
    'Free organic chemistry study tools: 22 functional groups, 40 named reactions with mechanisms, reaction predictor, and interactive reference guides.',
  keywords: [
    'organic chemistry',
    'functional groups',
    'named reactions',
    'reaction mechanisms',
    'organic chemistry study guide',
    'Grignard reaction',
    'Diels-Alder',
    'SN1 SN2',
    'aldol condensation',
  ],
}

const TOOLS = [
  {
    href: '/organic/functional-groups',
    icon: '🔬',
    label: 'Functional Groups',
    description: `Interactive guide to ${FUNCTIONAL_GROUPS.length} functional groups with properties, spectroscopy data, reactions, and examples.`,
    count: `${FUNCTIONAL_GROUPS.length} groups`,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    href: '/organic/reactions',
    icon: '⚗️',
    label: 'Named Reactions',
    description: `Browse ${NAMED_REACTIONS.length} named reactions with step-by-step mechanisms, conditions, examples, and key points.`,
    count: `${NAMED_REACTIONS.length} reactions`,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    href: '/organic/predict',
    icon: '🎯',
    label: 'Reaction Predictor',
    description:
      'Select a functional group and reagent to predict the product. Learn what happens and why.',
    count: 'Interactive',
    color: 'from-purple-500 to-pink-600',
  },
]

const QUICK_STATS = [
  { label: 'Functional Groups', value: FUNCTIONAL_GROUPS.length },
  { label: 'Named Reactions', value: REACTION_STATISTICS.total },
  { label: 'Nobel Prize Reactions', value: REACTION_STATISTICS.nobelPrizeReactions },
  { label: 'Difficulty Levels', value: 3 },
]

export default function OrganicChemistryHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/tools"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              All Tools
            </Link>
            <Link
              href="/"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <span>🧪</span> Organic Chemistry Suite
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground">
            Master Organic Chemistry
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto text-lg">
            From functional groups to named reactions to product prediction — everything you need to
            ace organic chemistry, completely free.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {QUICK_STATS.map(stat => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Main Tools */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {TOOLS.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-2xl border-2 border-border bg-card hover:border-primary-400 hover:shadow-xl transition-all overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${tool.color} p-5 text-white`}>
                <span className="text-4xl">{tool.icon}</span>
                <div className="mt-2 text-sm font-medium opacity-80">{tool.count}</div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-card-foreground group-hover:text-primary-600 transition-colors">
                  {tool.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {tool.description}
                </p>
                <div className="mt-4 text-sm text-primary-600 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Explore <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Featured Reactions Preview */}
        <section className="mb-14">
          <h3 className="text-2xl font-bold text-foreground mb-6">Featured Reactions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NAMED_REACTIONS.filter(r => r.tags.includes('Nobel'))
              .slice(0, 4)
              .map(reaction => (
                <Link
                  key={reaction.id}
                  href={`/organic/reactions/${reaction.id}`}
                  className="group rounded-xl border border-border bg-card hover:border-amber-400 hover:shadow-md transition-all p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-500 text-sm">🏆 Nobel Prize</span>
                    <span className="text-xs text-muted-foreground">{reaction.year}</span>
                  </div>
                  <h4 className="font-semibold text-card-foreground group-hover:text-primary-600 transition-colors">
                    {reaction.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{reaction.discoverer}</p>
                  <div className="mt-2">
                    <span className="inline-block text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                      {reaction.category}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* Study Guide */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">Study Roadmap</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Functional Groups</h4>
                <p className="text-sm text-muted-foreground">
                  Start by learning the 22 major functional groups — their structures, properties,
                  and naming. This is the alphabet of organic chemistry.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Introductory Reactions</h4>
                <p className="text-sm text-muted-foreground">
                  Master the 15 foundation reactions: SN1/SN2, E1/E2, additions, eliminations, and
                  radical reactions. These appear on every exam.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Named Reactions</h4>
                <p className="text-sm text-muted-foreground">
                  Tackle the 15 intermediate named reactions: Grignard, Aldol, Wittig, Diels-Alder,
                  and more. These are the power tools of synthesis.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Advanced & Prediction</h4>
                <p className="text-sm text-muted-foreground">
                  Explore cross-coupling, metathesis, and asymmetric catalysis. Use the Reaction
                  Predictor to test your understanding.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
