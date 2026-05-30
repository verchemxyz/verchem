import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CalcShell } from '@/components/lab'
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
    <CalcShell
      eyebrow="Organic chemistry · named reaction"
      title={reaction.name}
      backHref="/organic/reactions"
      backLabel="All Reactions"
      maxWidth="4xl"
    >
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground">
          <Link href="/organic" className="hover:text-primary-600">
            Organic
          </Link>{' '}
          /{' '}
          <Link href="/organic/reactions" className="hover:text-primary-600">
            Reactions
          </Link>{' '}
          / <span className="text-foreground">{reaction.name}</span>
        </nav>

        {/* Meta Section */}
        <section>
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning-strong">
                Nobel Prize {reaction.year}
              </span>
            )}
          </div>
          {reaction.altNames && reaction.altNames.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Also known as: {reaction.altNames.join(', ')}
            </p>
          )}
          {reaction.discoverer && (
            <p className="text-sm text-muted-foreground mt-1">
              Discovered by {reaction.discoverer}
              {reaction.year && ` (${reaction.year})`}
            </p>
          )}
        </section>

        {/* Equation */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            General Equation
          </h3>
          <div className="font-mono text-lg text-primary-700 bg-muted border border-border rounded-md p-4 text-center">
            {reaction.equation}
          </div>
        </section>

        {/* Description */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-foreground leading-relaxed">{reaction.description}</p>
        </section>

        {/* Reaction Scheme */}
        <section className="bg-card border border-border rounded-lg p-5">
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
        <section className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Mechanism ({reaction.mechanism.length} steps)
          </h3>
          <div className="space-y-4">
            {reaction.mechanism.map((step, idx) => (
              <div key={idx} className="relative pl-10">
                {/* Step number */}
                <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-primary-500 text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                {/* Connector line */}
                {idx < reaction.mechanism.length - 1 && (
                  <div className="absolute left-3.5 top-7 w-px h-[calc(100%+0.5rem)] bg-primary-200" />
                )}
                <div className="bg-muted border border-border rounded-md p-4">
                  <p className="text-foreground text-sm leading-relaxed">{step.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                      Arrow: {step.arrowType}
                    </span>
                    {step.intermediateFormula && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning-strong font-mono">
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
        <section className="bg-card border border-border rounded-lg p-5">
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
        <section className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Examples
          </h3>
          <div className="space-y-3">
            {reaction.examples.map((ex, i) => (
              <div key={i} className="bg-muted border border-border rounded-md p-4 text-sm">
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
                  <div className="mt-2 text-xs text-success bg-success/10 inline-block px-2 py-0.5 rounded">
                    Yield: {ex.yield}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Synthetic Utility + Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Synthetic Utility
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{reaction.syntheticUtility}</p>
          </section>
          <section className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Limitations
            </h3>
            <ul className="space-y-1">
              {reaction.limitations.map((lim, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 text-destructive shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                  <span className="text-foreground">{lim}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Tags */}
        <section>
          <div className="flex flex-wrap gap-2">
            {reaction.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-card border border-border rounded-full text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* Related Reactions */}
        {related.length > 0 && (
          <section className="bg-card border border-border rounded-lg p-5">
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
                    className="group rounded-lg border border-border p-3 hover:border-primary-400 transition-colors"
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
    </CalcShell>
  )
}
