'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FUNCTIONAL_GROUPS, FUNCTIONAL_GROUP_CATEGORIES } from '@/lib/data/organic/functional-groups'
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
              href="/organic"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              ← Organic Hub
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Reaction Predictor
          </h2>
          <p className="text-secondary-600 max-w-xl mx-auto">
            Select a starting functional group and a reagent to predict the product. Learn the
            mechanism and selectivity for each transformation.
          </p>
        </div>

        {/* Predictor Card */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 sm:p-8 mb-8">
          {/* Step 1: Select Functional Group */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Step 1: Select Starting Functional Group
            </label>
            <select
              value={selectedGroupId}
              onChange={e => {
                setSelectedGroupId(e.target.value)
                setSelectedReagent('')
                setShowResult(false)
              }}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Select functional group"
            >
              <option value="">Choose a functional group...</option>
              {FUNCTIONAL_GROUPS.map(group => {
                const catData = FUNCTIONAL_GROUP_CATEGORIES[group.category]
                return (
                  <option key={group.id} value={group.id}>
                    {catData.icon} {group.name} ({group.generalFormula})
                  </option>
                )
              })}
            </select>
            {fromGroup && (
              <div className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{fromGroup.name}</span> —{' '}
                {fromGroup.structure} — {fromGroup.description.slice(0, 100)}...
              </div>
            )}
          </div>

          {/* Step 2: Select Reagent */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Step 2: Select Reagent / Conditions
            </label>
            <select
              value={selectedReagent}
              onChange={e => {
                setSelectedReagent(e.target.value)
                setShowResult(false)
              }}
              disabled={!selectedGroupId || availableReagents.length === 0}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>

          {/* Predict Button */}
          <div className="flex gap-3">
            <button
              onClick={handlePredict}
              disabled={!selectedGroupId || !selectedReagent}
              className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Predict Product
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-secondary-100 text-secondary-700 rounded-xl font-medium hover:bg-secondary-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Result */}
        {showResult && prediction && (
          <div className="bg-card border-2 border-primary-400 rounded-2xl p-6 sm:p-8 mb-8 shadow-lg">
            {/* Visual Flow */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 text-center">
              {/* From */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex-1 w-full">
                <div className="text-xs text-blue-500 font-medium uppercase mb-1">Starting Material</div>
                <div className="text-lg font-bold text-blue-700">{fromGroup?.name}</div>
                <div className="text-sm text-blue-600 font-mono">{fromGroup?.structure}</div>
              </div>

              {/* Arrow with reagent */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground font-medium bg-background px-3 py-1 rounded-full border border-border mb-1">
                  {prediction.reagentLabel}
                </div>
                <div className="text-2xl text-primary-500">→</div>
                <div className="text-xs text-muted-foreground mt-1">{prediction.mechanismType}</div>
              </div>

              {/* To */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex-1 w-full">
                <div className="text-xs text-green-500 font-medium uppercase mb-1">Product</div>
                <div className="text-lg font-bold text-green-700">{toGroup?.name || prediction.toGroup}</div>
                <div className="text-sm text-green-600 font-mono">{toGroup?.structure}</div>
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
                <span className="inline-block text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
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
          </div>
        )}

        {showResult && !prediction && (
          <div className="bg-card border-2 border-amber-300 rounded-2xl p-6 text-center mb-8">
            <p className="text-amber-700 font-medium">
              No prediction rule found for this combination. This combination may not be a common
              reaction, or it may not be in our database yet.
            </p>
          </div>
        )}

        {/* Quick Reference */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Available Transformations ({PREDICTION_RULES.length} rules)
          </h3>
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
                    <tr key={i} className="border-b border-border/50 hover:bg-primary-50/50">
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
        </div>
      </main>
    </div>
  )
}
