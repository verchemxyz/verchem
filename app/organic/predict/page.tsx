'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalcShell, Card, SectionTitle, Button, Field } from '@/components/lab'
import { FUNCTIONAL_GROUPS } from '@/lib/data/organic/functional-groups'
import { getReactionsForGroup, PREDICTION_RULES } from '@/lib/data/organic/prediction-rules'
import type { PredictionRule } from '@/lib/types/organic-chemistry'

export default function ReactionPredictorPage() {
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedReagent, setSelectedReagent] = useState('')
  const [showResult, setShowResult] = useState(false)

  const availableReagents = useMemo(() => {
    if (!selectedGroupId) return []
    return getReactionsForGroup(selectedGroupId)
  }, [selectedGroupId])

  const prediction = useMemo((): PredictionRule | null => {
    if (!selectedGroupId || !selectedReagent) return null
    return (
      PREDICTION_RULES.find(
        r => r.fromGroup === selectedGroupId && r.reagent === selectedReagent
      ) || null
    )
  }, [selectedGroupId, selectedReagent])

  const fromGroup = FUNCTIONAL_GROUPS.find(g => g.id === selectedGroupId)
  const toGroup = prediction ? FUNCTIONAL_GROUPS.find(g => g.id === prediction.toGroup) : null

  const handlePredict = () => {
    if (selectedGroupId && selectedReagent) {
      setShowResult(true)
    }
  }

  const handleReset = () => {
    setSelectedGroupId('')
    setSelectedReagent('')
    setShowResult(false)
  }

  return (
    <CalcShell
      eyebrow="Organic chemistry · Reaction predictor"
      title="Reaction Predictor"
      subtitle="Select a starting functional group and a reagent to predict the product. Learn the mechanism and selectivity for each transformation."
      backHref="/organic"
      backLabel="Organic Hub"
      maxWidth="4xl"
    >
      {/* Predictor Card */}
      <Card className="p-6 sm:p-8">
        {/* Step 1: Select Functional Group */}
        <div className="mb-6">
          <Field label="Step 1: Select starting functional group" htmlFor="fg-select">
            <select
              id="fg-select"
              value={selectedGroupId}
              onChange={e => {
                setSelectedGroupId(e.target.value)
                setSelectedReagent('')
                setShowResult(false)
              }}
              className="input-premium w-full"
              aria-label="Select functional group"
            >
              <option value="">Choose a functional group...</option>
              {FUNCTIONAL_GROUPS.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.generalFormula})
                </option>
              ))}
            </select>
          </Field>
          {fromGroup && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{fromGroup.name}</span> —{' '}
              {fromGroup.structure} — {fromGroup.description.slice(0, 100)}...
            </div>
          )}
        </div>

        {/* Step 2: Select Reagent */}
        <div className="mb-6">
          <Field label="Step 2: Select reagent / conditions" htmlFor="reagent-select">
            <select
              id="reagent-select"
              value={selectedReagent}
              onChange={e => {
                setSelectedReagent(e.target.value)
                setShowResult(false)
              }}
              disabled={!selectedGroupId || availableReagents.length === 0}
              className="input-premium w-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Select reagent"
            >
              <option value="">
                {!selectedGroupId
                  ? 'Select a functional group first...'
                  : availableReagents.length === 0
                    ? 'No reactions available for this group'
                    : `Choose from ${availableReagents.length} reagents...`}
              </option>
              {availableReagents.map(rule => (
                <option key={rule.reagent} value={rule.reagent}>
                  {rule.reagentLabel}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Predict Button */}
        <div className="flex gap-3">
          <Button
            onClick={handlePredict}
            disabled={!selectedGroupId || !selectedReagent}
            className="flex-1"
          >
            Predict Product
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Card>

      {/* Result */}
      {showResult && prediction && (
        <Card className="p-6 sm:p-8 border-l-2 border-l-primary-500">
          {/* Visual Flow */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 text-center">
            {/* From */}
            <div className="bg-muted border border-secondary-500/40 rounded-md p-4 flex-1 w-full">
              <div className="text-xs text-secondary-600 font-medium uppercase mb-1">Starting Material</div>
              <div className="text-lg font-bold text-foreground">{fromGroup?.name}</div>
              <div className="text-sm text-muted-foreground font-mono">{fromGroup?.structure}</div>
            </div>

            {/* Arrow with reagent */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-muted-foreground font-medium bg-card px-3 py-1 rounded-full border border-border mb-1">
                {prediction.reagentLabel}
              </div>
              <div className="text-2xl text-primary-500">→</div>
              <div className="text-xs text-muted-foreground mt-1">{prediction.mechanismType}</div>
            </div>

            {/* To */}
            <div className="bg-muted border border-primary-500/40 rounded-md p-4 flex-1 w-full">
              <div className="text-xs text-primary-600 font-medium uppercase mb-1">Product</div>
              <div className="text-lg font-bold text-foreground">{toGroup?.name || prediction.toGroup}</div>
              <div className="text-sm text-muted-foreground font-mono">{toGroup?.structure}</div>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-4">
            {prediction.reactionName && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Reaction Name
                </h3>
                <Link
                  href={`/organic/reactions/${PREDICTION_RULES.find(r => r.reactionName === prediction.reactionName)?.reactionName?.toLowerCase().replace(/\s+/g, '-') || '#'}`}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  {prediction.reactionName}
                </Link>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                What Happens
              </h3>
              <p className="text-foreground text-sm leading-relaxed">{prediction.explanation}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Mechanism Type
              </h3>
              <span className="inline-block text-sm px-3 py-1 bg-secondary-500/10 text-secondary-700 rounded-full">
                {prediction.mechanismType}
              </span>
            </div>

            {prediction.selectivity && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Selectivity
                </h3>
                <p className="text-foreground text-sm">{prediction.selectivity}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {showResult && !prediction && (
        <Card className="p-6 text-center border-l-2 border-l-warning">
          <p className="text-warning-strong font-medium">
            No prediction rule found for this combination. This combination may not be a common
            reaction, or it may not be in our database yet.
          </p>
        </Card>
      )}

      {/* Quick Reference */}
      <Card className="p-6">
        <SectionTitle className="mb-4">
          Available transformations ({PREDICTION_RULES.length} rules)
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">From</th>
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Reagent</th>
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">To</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Mechanism</th>
              </tr>
            </thead>
            <tbody>
              {PREDICTION_RULES.slice(0, 20).map((rule, i) => {
                const from = FUNCTIONAL_GROUPS.find(g => g.id === rule.fromGroup)
                const to = FUNCTIONAL_GROUPS.find(g => g.id === rule.toGroup)
                return (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted">
                    <td className="py-2 pr-3 text-foreground">{from?.name || rule.fromGroup}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{rule.reagentLabel}</td>
                    <td className="py-2 pr-3 text-foreground">{to?.name || rule.toGroup}</td>
                    <td className="py-2 text-muted-foreground">{rule.mechanismType}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {PREDICTION_RULES.length > 20 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Showing 20 of {PREDICTION_RULES.length} rules. Use the predictor above to explore all.
            </p>
          )}
        </div>
      </Card>
    </CalcShell>
  )
}
