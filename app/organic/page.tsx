import type { Metadata } from 'next'
import Link from 'next/link'
import { CalcShell, Card, SectionTitle } from '@/components/lab'
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
    label: 'Functional Groups',
    description: `Interactive guide to ${FUNCTIONAL_GROUPS.length} functional groups with properties, spectroscopy data, reactions, and examples.`,
    count: `${FUNCTIONAL_GROUPS.length} groups`,
  },
  {
    href: '/organic/reactions',
    label: 'Named Reactions',
    description: `Browse ${NAMED_REACTIONS.length} named reactions with step-by-step mechanisms, conditions, examples, and key points.`,
    count: `${NAMED_REACTIONS.length} reactions`,
  },
  {
    href: '/organic/predict',
    label: 'Reaction Predictor',
    description:
      'Select a functional group and reagent to predict the product. Learn what happens and why.',
    count: 'Interactive',
  },
]

const QUICK_STATS = [
  { label: 'Functional Groups', value: FUNCTIONAL_GROUPS.length },
  { label: 'Named Reactions', value: REACTION_STATISTICS.total },
  { label: 'Nobel Prize Reactions', value: REACTION_STATISTICS.nobelPrizeReactions },
  { label: 'Difficulty Levels', value: 3 },
]

const ROADMAP = [
  {
    step: 1,
    title: 'Functional Groups',
    body: 'Start by learning the 22 major functional groups — their structures, properties, and naming. This is the alphabet of organic chemistry.',
  },
  {
    step: 2,
    title: 'Introductory Reactions',
    body: 'Master the 15 foundation reactions: SN1/SN2, E1/E2, additions, eliminations, and radical reactions. These appear on every exam.',
  },
  {
    step: 3,
    title: 'Named Reactions',
    body: 'Tackle the 15 intermediate named reactions: Grignard, Aldol, Wittig, Diels-Alder, and more. These are the power tools of synthesis.',
  },
  {
    step: 4,
    title: 'Advanced & Prediction',
    body: 'Explore cross-coupling, metathesis, and asymmetric catalysis. Use the Reaction Predictor to test your understanding.',
  },
]

export default function OrganicChemistryHub() {
  return (
    <CalcShell
      eyebrow="Organic chemistry suite"
      title="Master Organic Chemistry"
      subtitle="From functional groups to named reactions to product prediction — everything you need to ace organic chemistry, completely free."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {QUICK_STATS.map(stat => (
          <Card key={stat.label} className="p-4 text-center">
            <div className="text-3xl font-bold font-mono text-primary-600">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </Card>
        ))}
      </section>

      {/* Main Tools */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group block h-full"
          >
            <Card className="h-full transition-colors hover:border-primary-500 overflow-hidden">
              <div className="border-b border-border bg-muted px-5 py-4">
                <div className="text-xs font-mono uppercase tracking-wider text-primary-600 font-medium">
                  {tool.count}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary-600 transition-colors">
                  {tool.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {tool.description}
                </p>
                <div className="mt-4 text-sm text-primary-600 font-semibold inline-flex items-center gap-1">
                  Explore
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      {/* Featured Reactions Preview */}
      <section>
        <SectionTitle className="mb-6 text-2xl">Featured reactions</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NAMED_REACTIONS.filter(r => r.tags.includes('Nobel'))
            .slice(0, 4)
            .map(reaction => (
              <Link
                key={reaction.id}
                href={`/organic/reactions/${reaction.id}`}
                className="group block h-full"
              >
                <Card className="h-full transition-colors hover:border-primary-500 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-warning-strong text-xs font-semibold uppercase tracking-wide">Nobel Prize</span>
                    <span className="text-xs text-muted-foreground">{reaction.year}</span>
                  </div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                    {reaction.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{reaction.discoverer}</p>
                  <div className="mt-2">
                    <span className="inline-block text-xs px-2 py-0.5 bg-primary-500/10 text-primary-700 rounded-full">
                      {reaction.category}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
        </div>
      </section>

      {/* Study Guide */}
      <Card className="p-6 sm:p-8">
        <SectionTitle className="mb-4 text-2xl">Study roadmap</SectionTitle>
        <div className="space-y-4">
          {ROADMAP.map(item => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-700 flex items-center justify-center font-bold text-sm font-mono shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </CalcShell>
  )
}
