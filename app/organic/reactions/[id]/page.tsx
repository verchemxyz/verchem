import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  NAMED_REACTIONS,
  REACTION_CATEGORIES,
  DIFFICULTY_LEVELS,
  getReactionById,
  getRelatedReactions,
} from '@/lib/data/organic/named-reactions'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return NAMED_REACTIONS.map(r => ({ id: r.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const reaction = getReactionById(id)
  if (!reaction) return { title: 'Reaction Not Found | VerChem' }

  return {
    title: `${reaction.name} — Mechanism, Examples & Key Points`,
    description: `${reaction.name}: ${reaction.description.slice(0, 150)}... Step-by-step mechanism, examples, and study notes.`,
    keywords: [
      reaction.name,
      ...reaction.tags,
      'organic chemistry',
      'reaction mechanism',
      ...(reaction.altNames || []),
    ],
  }
}

export default async function ReactionDetailPage({ params }: PageProps) {
  const { id } = await params
  const reaction = getReactionById(id)

  if (!reaction) {
    notFound()
  }

  const catMeta = REACTION_CATEGORIES[reaction.category]
  const diffMeta = DIFFICULTY_LEVELS[reaction.difficulty]
  const related = getRelatedReactions(reaction.id)

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
              href="/organic/reactions"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              ← All Reactions
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/organic" className="hover:text-primary-600">
            Organic
          </Link>{' '}
          /{' '}
          <Link href="/organic/reactions" className="hover:text-primary-600">
            Reactions
          </Link>{' '}
          / <span className="text-foreground">{reaction.name}</span>
        </nav>

        {/* Title Section */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: catMeta.color }}
            >
              {catMeta.label}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: diffMeta.color }}
            >
              {diffMeta.label}
            </span>
            {reaction.tags.includes('Nobel') && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Nobel Prize {reaction.year}
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{reaction.name}</h2>
          {reaction.altNames && reaction.altNames.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Also known as: {reaction.altNames.join(', ')}
            </p>
          )}
          {reaction.discoverer && (
            <p className="text-sm text-secondary-600 mt-1">
              Discovered by {reaction.discoverer}
              {reaction.year && ` (${reaction.year})`}
            </p>
          )}
        </section>

        {/* Equation */}
        <section className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            General Equation
          </h3>
          <div className="font-mono text-lg text-primary-700 bg-primary-50 rounded-lg p-4 text-center">
            {reaction.equation}
          </div>
        </section>

        {/* Description */}
        <section className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-foreground leading-relaxed">{reaction.description}</p>
        </section>

        {/* Reaction Scheme */}
        <section className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Reaction Scheme
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-foreground">Reactants:</span>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {reaction.generalScheme.reactants.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium text-foreground">Products:</span>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {reaction.generalScheme.products.map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium text-foreground">Reagents:</span>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {reaction.generalScheme.reagents.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium text-foreground">Conditions:</span>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {reaction.generalScheme.conditions.map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Mechanism */}
        <section className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Mechanism ({reaction.mechanism.length} steps)
          </h3>
          <div className="space-y-4">
            {reaction.mechanism.map((step, idx) => (
              <div key={idx} className="relative pl-10">
                {/* Step number */}
                <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                {/* Connector line */}
                {idx < reaction.mechanism.length - 1 && (
                  <div className="absolute left-3.5 top-7 w-px h-[calc(100%+0.5rem)] bg-primary-200" />
                )}
                <div className="bg-background rounded-lg p-4">
                  <p className="text-foreground text-sm leading-relaxed">{step.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700">
                      Arrow: {step.arrowType}
                    </span>
                    {step.intermediateFormula && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-mono">
                        {step.intermediateFormula}
                      </span>
                    )}
                  </div>
                  {step.notes && (
                    <p className="text-xs text-primary-600 mt-2 italic">{step.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Points */}
        <section className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Key Points to Remember
          </h3>
          <ul className="space-y-2">
            {reaction.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary-500 shrink-0 mt-0.5">✓</span>
                <span className="text-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Examples */}
        <section className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Examples
          </h3>
          <div className="space-y-3">
            {reaction.examples.map((ex, i) => (
              <div key={i} className="bg-background rounded-lg p-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-muted-foreground">Reactant:</span>
                    <p className="font-medium text-foreground">{ex.reactant}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reagent:</span>
                    <p className="font-medium text-foreground">{ex.reagent}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <p className="font-medium text-foreground">{ex.product}</p>
                  </div>
                </div>
                {ex.yield && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 inline-block px-2 py-0.5 rounded">
                    Yield: {ex.yield}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Synthetic Utility + Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Synthetic Utility
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{reaction.syntheticUtility}</p>
          </section>
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Limitations
            </h3>
            <ul className="space-y-1">
              {reaction.limitations.map((lim, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400 shrink-0">⚠</span>
                  <span className="text-foreground">{lim}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Tags */}
        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {reaction.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-card border border-border rounded-full text-secondary-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* Related Reactions */}
        {related.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Related Reactions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map(rel => {
                const relCat = REACTION_CATEGORIES[rel.category]
                return (
                  <Link
                    key={rel.id}
                    href={`/organic/reactions/${rel.id}`}
                    className="group rounded-lg border border-border p-3 hover:border-primary-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: relCat.color }}
                      />
                      <h4 className="font-semibold text-sm text-card-foreground group-hover:text-primary-600 transition-colors">
                        {rel.name}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {rel.equation}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-border">
          <Link
            href="/organic/reactions"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← All Reactions
          </Link>
          <Link
            href="/organic/predict"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Reaction Predictor →
          </Link>
        </div>
      </main>
    </div>
  )
}
