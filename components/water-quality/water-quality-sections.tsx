'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Beaker,
  Calculator,
  CheckCircle,
  Factory,
  FlaskConical,
  Gauge,
  Leaf,
  RefreshCw,
  Thermometer,
  Zap,
} from 'lucide-react'
import { THAI_EFFLUENT_STANDARDS } from '@/lib/calculations/environmental'
import type { ThaiEffluentType } from '@/lib/types/environmental'

// ============================================
// THAI STANDARDS REFERENCE SECTION
// ============================================

export function ThaiStandardsSection() {
  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Thai Effluent Standards
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Reference values from the Pollution Control Department (PCD)
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {(['type_a', 'type_b', 'type_c'] as ThaiEffluentType[]).map((type) => {
            const std = THAI_EFFLUENT_STANDARDS[type]
            return (
              <div
                key={type}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-teal-500/30 transition-colors"
              >
                <h3 className="text-xl font-bold text-white mb-1">{std.nameThai}</h3>
                <p className="text-sm text-teal-400 mb-4">{std.name}</p>
                <p className="text-xs text-slate-500 mb-4">{std.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">BOD</span>
                    <span className="text-white font-mono">{std.limits.bod} mg/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">COD</span>
                    <span className="text-white font-mono">{std.limits.cod} mg/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SS</span>
                    <span className="text-white font-mono">{std.limits.ss} mg/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TDS</span>
                    <span className="text-white font-mono">{std.limits.tds} mg/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">pH</span>
                    <span className="text-white font-mono">
                      {std.limits.ph_min}-{std.limits.ph_max}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Temp</span>
                    <span className="text-white font-mono">{std.limits.temperature}C</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FORMULAS SECTION
// ============================================

export function FormulasSection() {
  const formulas = [
    {
      icon: Beaker,
      title: 'BOD5',
      formula: 'BOD5 = (D1 - D2) x DF',
      note: 'DF = Bottle Volume / Sample Volume',
      color: 'text-blue-400',
    },
    {
      icon: Gauge,
      title: 'Ultimate BOD',
      formula: 'BODu = BOD5 / (1 - e^(-k*5))',
      note: 'k = first-order rate constant',
      color: 'text-cyan-400',
    },
    {
      icon: FlaskConical,
      title: 'COD (Dichromate)',
      formula: 'COD = (A - B) x N x 8000 / V',
      note: 'A=blank, B=sample, N=normality',
      color: 'text-orange-400',
    },
    {
      icon: Calculator,
      title: 'BOD/COD Ratio',
      formula: '>0.5: Easily biodegradable\n0.3-0.5: Moderate\n<0.3: Difficult',
      note: '',
      color: 'text-green-400',
    },
    {
      icon: Thermometer,
      title: 'Temp Correction',
      formula: 'kT = k20 x theta^(T-20)',
      note: 'theta = 1.047 (typical)',
      color: 'text-red-400',
    },
    {
      icon: RefreshCw,
      title: 'Removal Efficiency',
      formula: 'E = (Cin - Cout) / Cin x 100%',
      note: 'Cin=influent, Cout=effluent',
      color: 'text-emerald-400',
    },
  ]

  return (
    <section className="py-16 px-4 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Key Formulas
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {formulas.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <f.icon className={`h-8 w-8 ${f.color} mb-4`} />
              <h3 className="text-lg font-semibold text-white mb-4">{f.title}</h3>
              <div className="space-y-2 font-mono text-sm text-slate-300">
                {f.formula.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {f.note && <p className="text-xs text-slate-500">{f.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FEATURES SECTION
// ============================================

export function FeaturesSection() {
  const features = [
    {
      icon: Factory,
      title: 'Industrial Compliance',
      description: 'Check wastewater against Thai effluent standards instantly',
    },
    {
      icon: Leaf,
      title: 'Environmental Protection',
      description: 'Ensure proper treatment before discharge',
    },
    {
      icon: Calculator,
      title: '9 Calculation Modes',
      description: 'BOD5, COD, k-rate, loading, efficiency, and more',
    },
    {
      icon: Beaker,
      title: 'APHA Methods',
      description: 'Standard Methods for Water and Wastewater analysis',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get calculations in milliseconds with step-by-step solutions',
    },
    {
      icon: CheckCircle,
      title: 'Visual Compliance',
      description: 'Clear pass/fail indicators with exceedance details',
    },
  ]

  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Use This Calculator?
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-teal-500/30 transition-colors"
            >
              <feature.icon className="h-8 w-8 text-teal-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FAQ SECTION
// ============================================

export function FAQSection() {
  const faqs = [
    {
      q: 'What is BOD (Biochemical Oxygen Demand)?',
      a: 'BOD measures the amount of oxygen consumed by microorganisms to decompose organic matter in water over 5 days at 20C. Higher BOD indicates more organic pollution. BOD5 is the standard 5-day test used worldwide.',
    },
    {
      q: 'What is COD (Chemical Oxygen Demand)?',
      a: 'COD measures the total quantity of oxygen required to oxidize all organic material in water using a strong chemical oxidant (dichromate). COD is always higher than BOD because it includes non-biodegradable organics.',
    },
    {
      q: 'What does the BOD/COD ratio tell us?',
      a: 'The BOD/COD ratio indicates how biodegradable the wastewater is. Ratio >0.5 means easily biodegradable (suitable for biological treatment). Ratio <0.3 means difficult to biodegrade (may need chemical/physical treatment first).',
    },
    {
      q: 'What are Thai effluent standards?',
      a: 'Thai effluent standards are set by the Pollution Control Department (PCD). Type A is strictest (industrial estates), Type B is general industry, and Type C is for community/municipal wastewater. All discharges must comply with these limits.',
    },
    {
      q: 'What is the k-rate in BOD calculations?',
      a: 'The k-rate (deoxygenation rate constant) describes how fast organic matter is decomposed. Typical values range from 0.1-0.3/day. Higher k means faster decomposition. It varies with temperature, waste type, and microbial activity.',
    },
  ]

  return (
    <section className="py-16 px-4 border-t border-white/5">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
              <p className="text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA SECTION
// ============================================

export function CTASection() {
  return (
    <section className="py-16 px-4 border-t border-white/5">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          Explore More Chemistry Tools
        </h2>
        <p className="text-slate-400 mb-8">
          VerChem offers a complete suite of chemistry calculators and tools
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/tools/ph-calculator"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
          >
            pH Calculator
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
            href="/tools/gas-laws"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
          >
            Gas Laws
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/periodic-table"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 font-medium text-white hover:from-teal-500 hover:to-cyan-500 transition-colors"
          >
            Interactive Periodic Table
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
