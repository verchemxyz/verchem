'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FRAGMENT_LOSSES,
  ISOTOPE_PATTERNS,
  COMMON_IONS,
  MCLAFFERTY_INFO,
  identifyFragmentLoss,
  identifyIon,
  predictIsotopePattern,
  checkNitrogenRule,
} from '@/lib/data/spectroscopy/mass-spec-data'

// ---------------------------------------------------------------------------
// Types for local state
// ---------------------------------------------------------------------------

interface IsotopeBar {
  mz: number
  relativeIntensity: number
}

// ---------------------------------------------------------------------------
// Component: FragmentLossSection
// ---------------------------------------------------------------------------

function FragmentLossSection() {
  const [parentMz, setParentMz] = useState('')
  const [fragmentMz, setFragmentMz] = useState('')
  const [results, setResults] = useState<
    { massLost: number; fragment: string; interpretation: string; commonSources: string[]; category: string }[]
  >([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleIdentify = useCallback(() => {
    const parent = parseFloat(parentMz)
    const fragment = parseFloat(fragmentMz)
    if (isNaN(parent) || isNaN(fragment) || parent <= 0 || fragment <= 0) {
      setResults([])
      setHasSearched(false)
      return
    }
    const matches = identifyFragmentLoss(parent, fragment)
    setResults(matches)
    setHasSearched(true)
  }, [parentMz, fragmentMz])

  const handleQuick = useCallback((p: string, f: string) => {
    setParentMz(p)
    setFragmentMz(f)
    const matches = identifyFragmentLoss(parseFloat(p), parseFloat(f))
    setResults(matches)
    setHasSearched(true)
  }, [])

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-card-foreground mb-1">
        Fragment Loss Identifier
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Enter the parent ion m/z and a fragment ion m/z to identify the neutral
        or radical species lost.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Parent m/z
          </label>
          <input
            type="text"
            value={parentMz}
            onChange={(e) => setParentMz(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleIdentify()
            }}
            placeholder="e.g. 100"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Fragment m/z
          </label>
          <input
            type="text"
            value={fragmentMz}
            onChange={(e) => setFragmentMz(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleIdentify()
            }}
            placeholder="e.g. 72"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      <button
        onClick={handleIdentify}
        className="w-full px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors mb-3"
      >
        Identify Loss
      </button>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-muted-foreground py-1">Try:</span>
        {[
          { label: '100 \u2192 72 (CO)', p: '100', f: '72' },
          { label: '120 \u2192 77 (acetyl)', p: '120', f: '77' },
          { label: '150 \u2192 105 (OEt)', p: '150', f: '105' },
          { label: '88 \u2192 60 (C\u2082H\u2084)', p: '88', f: '60' },
        ].map((ex) => (
          <button
            key={ex.label}
            onClick={() => handleQuick(ex.p, ex.f)}
            className="text-xs px-3 py-1 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {hasSearched && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Mass lost: <strong>{(parseFloat(parentMz) - parseFloat(fragmentMz)).toFixed(1)} Da</strong>
            {' '}&mdash;{' '}
            {results.length === 0 ? (
              'No matching losses found'
            ) : (
              <span className="text-amber-600">
                {results.length} possible loss{results.length !== 1 ? 'es' : ''}
              </span>
            )}
          </p>
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="bg-white/50 dark:bg-white/5 border border-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-card-foreground">
                      &minus;{r.massLost} ({r.fragment})
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.interpretation}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Common in:</strong> {r.commonSources.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Component: IonIdentifierSection
// ---------------------------------------------------------------------------

function IonIdentifierSection() {
  const [mzInput, setMzInput] = useState('')
  const [results, setResults] = useState<
    { mz: number; formula: string; name: string; source: string; category: string }[]
  >([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleIdentify = useCallback(() => {
    const val = parseFloat(mzInput)
    if (isNaN(val) || val <= 0) {
      setResults([])
      setHasSearched(false)
      return
    }
    setResults(identifyIon(val))
    setHasSearched(true)
  }, [mzInput])

  const handleQuick = useCallback((value: string) => {
    setMzInput(value)
    const val = parseFloat(value)
    setResults(identifyIon(val))
    setHasSearched(true)
  }, [])

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-card-foreground mb-1">
        Ion Identifier
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Enter a fragment ion m/z value to identify common ions at that mass.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={mzInput}
          onChange={(e) => setMzInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleIdentify()
          }}
          placeholder="e.g. 91, 77, 43"
          className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        <button
          onClick={handleIdentify}
          className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors flex-shrink-0"
        >
          Identify
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-muted-foreground py-1">Try:</span>
        {['91', '77', '43', '57', '105', '29'].map((val) => (
          <button
            key={val}
            onClick={() => handleQuick(val)}
            className="text-xs px-3 py-1 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
          >
            m/z {val}
          </button>
        ))}
      </div>

      {hasSearched && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {results.length === 0 ? (
              'No matching common ions found at this m/z.'
            ) : (
              <span className="text-amber-600">
                {results.length} match{results.length !== 1 ? 'es' : ''} found
              </span>
            )}
          </p>
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="bg-white/50 dark:bg-white/5 border border-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm font-mono text-card-foreground">
                      m/z {r.mz}
                    </span>
                    <span className="font-semibold text-sm text-amber-600">
                      {r.formula}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-card-foreground font-medium">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.source}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Component: IsotopePatternSection
// ---------------------------------------------------------------------------

function IsotopePatternSection() {
  const [formula, setFormula] = useState<Record<string, number>>({
    C: 0,
    H: 0,
    N: 0,
    O: 0,
    Cl: 0,
    Br: 0,
    S: 0,
  })
  const [pattern, setPattern] = useState<IsotopeBar[]>([])
  const [hasCalculated, setHasCalculated] = useState(false)

  const elements = useMemo(
    () => ['C', 'H', 'N', 'O', 'Cl', 'Br', 'S'] as const,
    []
  )

  const handleChange = useCallback(
    (el: string, value: string) => {
      const num = parseInt(value, 10)
      setFormula((prev) => ({
        ...prev,
        [el]: isNaN(num) || num < 0 ? 0 : num,
      }))
    },
    []
  )

  const handlePredict = useCallback(() => {
    const hasAtoms = Object.values(formula).some((v) => v > 0)
    if (!hasAtoms) {
      setPattern([])
      setHasCalculated(false)
      return
    }
    const result = predictIsotopePattern(formula)
    setPattern(result)
    setHasCalculated(true)
  }, [formula])

  const handlePreset = useCallback(
    (preset: Record<string, number>) => {
      setFormula({ C: 0, H: 0, N: 0, O: 0, Cl: 0, Br: 0, S: 0, ...preset })
      const result = predictIsotopePattern(preset)
      setPattern(result)
      setHasCalculated(true)
    },
    []
  )

  const maxIntensity = useMemo(
    () => Math.max(...pattern.map((p) => p.relativeIntensity), 1),
    [pattern]
  )

  const formulaString = useMemo(() => {
    return elements
      .filter((el) => formula[el] > 0)
      .map((el) => `${el}${formula[el] > 1 ? formula[el] : ''}`)
      .join('')
  }, [formula, elements])

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-card-foreground mb-1">
        Isotope Pattern Predictor
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Enter atom counts for a molecular formula to predict M, M+1, and M+2
        relative intensities.
      </p>

      {/* Element inputs */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
        {elements.map((el) => (
          <div key={el}>
            <label className="text-xs font-semibold text-muted-foreground block mb-1 text-center">
              {el}
            </label>
            <input
              type="number"
              min={0}
              value={formula[el] || ''}
              onChange={(e) => handleChange(el, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePredict()
              }}
              className="w-full px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handlePredict}
        className="w-full px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors mb-3"
      >
        Predict Pattern
      </button>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-muted-foreground py-1">Presets:</span>
        {([
          { label: 'CH\u2083Cl (chloromethane)', preset: { C: 1, H: 3, Cl: 1 } },
          { label: 'C\u2086H\u2085Br (bromobenzene)', preset: { C: 6, H: 5, Br: 1 } },
          { label: 'C\u2082H\u2086O (ethanol)', preset: { C: 2, H: 6, O: 1 } },
          { label: 'C\u2086H\u2085NO\u2082 (nitrobenzene)', preset: { C: 6, H: 5, N: 1, O: 2 } },
        ] as { label: string; preset: Record<string, number> }[]).map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.preset)}
            className="text-xs px-3 py-1 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {hasCalculated && pattern.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Formula: <strong className="text-card-foreground">{formulaString || 'none'}</strong>
            {' '}&middot; M = {pattern[0]?.mz ?? 0}
          </p>

          {/* Bar chart */}
          <div className="flex items-end gap-3 h-40 border-b border-border px-4 pb-1 mb-2">
            {pattern.map((bar) => (
              <div key={bar.mz} className="flex flex-col items-center flex-1">
                <span className="text-[10px] font-semibold text-card-foreground mb-1">
                  {bar.relativeIntensity.toFixed(1)}%
                </span>
                <div
                  className="w-full max-w-[40px] bg-amber-500 rounded-t transition-all"
                  style={{
                    height: `${(bar.relativeIntensity / maxIntensity) * 120}px`,
                    minHeight: bar.relativeIntensity > 0 ? '4px' : '0px',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 px-4">
            {pattern.map((bar, i) => (
              <div key={bar.mz} className="flex-1 text-center">
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {i === 0 ? 'M' : `M+${i}`}
                </span>
                <br />
                <span className="text-[10px] text-muted-foreground">
                  m/z {bar.mz}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Component: NitrogenRuleSection
// ---------------------------------------------------------------------------

function NitrogenRuleSection() {
  const [mwInput, setMwInput] = useState('')
  const [result, setResult] = useState('')
  const [hasChecked, setHasChecked] = useState(false)

  const handleCheck = useCallback(() => {
    const val = parseFloat(mwInput)
    if (isNaN(val) || val <= 0) {
      setResult('')
      setHasChecked(false)
      return
    }
    setResult(checkNitrogenRule(val))
    setHasChecked(true)
  }, [mwInput])

  const handleQuick = useCallback((value: string) => {
    setMwInput(value)
    setResult(checkNitrogenRule(parseFloat(value)))
    setHasChecked(true)
  }, [])

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-card-foreground mb-1">
        Nitrogen Rule Checker
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Enter a molecular weight to determine whether the compound likely
        contains nitrogen.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={mwInput}
          onChange={(e) => setMwInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCheck()
          }}
          placeholder="e.g. 93, 78, 122"
          className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        <button
          onClick={handleCheck}
          className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors flex-shrink-0"
        >
          Check
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-muted-foreground py-1">Try:</span>
        {[
          { label: '93 (aniline)', val: '93' },
          { label: '78 (benzene)', val: '78' },
          { label: '122 (benzoic acid)', val: '122' },
          { label: '123 (nitrobenzene)', val: '123' },
        ].map((ex) => (
          <button
            key={ex.val}
            onClick={() => handleQuick(ex.val)}
            className="text-xs px-3 py-1 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {hasChecked && result && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-card-foreground leading-relaxed">
            {result}
          </p>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function MassSpecPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="VerChem Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/spectroscopy"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              &larr; Spectroscopy Hub
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Title */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
            Mass Spectrometry
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
            Mass Spec Analyzer
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Identify fragment losses, common ions, and isotope patterns. Predict
            M/M+1/M+2 ratios and check the nitrogen rule for unknown
            identification.
          </p>
        </section>

        {/* 2x2 grid of tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <FragmentLossSection />
          <IonIdentifierSection />
          <IsotopePatternSection />
          <NitrogenRuleSection />
        </div>

        {/* McLafferty Rearrangement Reference */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-card-foreground mb-2">
            {MCLAFFERTY_INFO.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {MCLAFFERTY_INFO.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-card-foreground mb-2">
                Requirements
              </h4>
              <ul className="space-y-1">
                {MCLAFFERTY_INFO.requirements.map((r, i) => (
                  <li key={i} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">&#10003;</span>
                    {r}
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold text-card-foreground mt-4 mb-2">
                Applicable To
              </h4>
              <ul className="space-y-1">
                {MCLAFFERTY_INFO.applicableTo.map((a, i) => (
                  <li key={i} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">&bull;</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-card-foreground mb-2">
                Mechanism Steps
              </h4>
              <ol className="space-y-1.5 list-decimal list-inside">
                {MCLAFFERTY_INFO.mechanism.map((step, i) => (
                  <li key={i} className="text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>

              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-card-foreground mb-1 text-sm">
                  Worked Example: {MCLAFFERTY_INFO.example.compound}
                </h4>
                <p className="text-xs text-muted-foreground">
                  MW = {MCLAFFERTY_INFO.example.molecularWeight} &rarr;{' '}
                  {MCLAFFERTY_INFO.example.process}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Product ion: <strong>m/z {MCLAFFERTY_INFO.example.productIon}</strong>{' '}
                  ({MCLAFFERTY_INFO.example.productFormula}) &middot; Lost:{' '}
                  {MCLAFFERTY_INFO.example.lostNeutral}
                </p>
              </div>

              <p className="mt-3 text-xs text-muted-foreground italic">
                {MCLAFFERTY_INFO.diagnosticValue}
              </p>
            </div>
          </div>
        </section>

        {/* Fragment Losses Reference Table */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-card-foreground mb-1">
            Common Fragment Losses Reference
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete table of common neutral and radical losses in EI mass
            spectrometry.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-left">
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Mass Lost
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Fragment
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Interpretation
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden md:table-cell">
                    Common Sources
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FRAGMENT_LOSSES.map((fl) => (
                  <tr key={fl.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-2 font-mono font-semibold text-amber-600">
                      {fl.massLost}
                    </td>
                    <td className="px-4 py-2 font-mono text-card-foreground">
                      {fl.fragment}
                    </td>
                    <td className="px-4 py-2 text-card-foreground">
                      {fl.interpretation}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          fl.category === 'radical'
                            ? 'bg-red-100 text-red-700'
                            : fl.category === 'neutral'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {fl.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell max-w-xs">
                      {fl.commonSources.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Isotope Patterns Reference */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-card-foreground mb-1">
            Isotope Pattern Reference
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            M+1 and M+2 contributions per atom for common elements.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-left">
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Element
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Symbol
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    M+1 (%)
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    M+2 (%)
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden md:table-cell">
                    Significance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ISOTOPE_PATTERNS.map((ip) => (
                  <tr key={ip.symbol} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-2 text-card-foreground font-medium">
                      {ip.element}
                    </td>
                    <td className="px-4 py-2 font-mono font-semibold text-amber-600">
                      {ip.symbol}
                    </td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">
                      {ip.mPlus1.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">
                      {ip.mPlus2.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell max-w-sm">
                      {ip.significance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Common Ions Reference */}
        <section className="bg-card border border-border rounded-xl p-6 mb-10">
          <h3 className="text-lg font-bold text-card-foreground mb-1">
            Common Fragment Ions
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Frequently observed cations in electron ionization (EI) mass
            spectra.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-left">
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    m/z
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Formula
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden md:table-cell">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMMON_IONS.map((ion) => (
                  <tr key={ion.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-2 font-mono font-semibold text-amber-600">
                      {ion.mz}
                    </td>
                    <td className="px-4 py-2 font-mono text-card-foreground">
                      {ion.formula}
                    </td>
                    <td className="px-4 py-2 text-card-foreground font-medium">
                      {ion.name}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          ion.category === 'aromatic'
                            ? 'bg-purple-100 text-purple-700'
                            : ion.category === 'alkyl'
                              ? 'bg-green-100 text-green-700'
                              : ion.category === 'carbonyl'
                                ? 'bg-amber-100 text-amber-700'
                                : ion.category === 'nitrogen'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ion.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell max-w-xs">
                      {ion.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/spectroscopy/nmr"
              className="text-amber-600 hover:underline font-medium"
            >
              &larr; NMR Analyzer
            </Link>
            {' '}&middot;{' '}
            <Link
              href="/spectroscopy"
              className="text-amber-600 hover:underline font-medium"
            >
              Spectroscopy Hub
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
