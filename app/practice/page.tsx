'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalcShell, Card } from '@/components/lab'

// ============================================
// Types
// ============================================
interface Problem {
  id: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  hints: string[]
  answer: string
  solution: string[]
  relatedCalculator: string
}

// ============================================
// Practice Problems Data
// ============================================
const PROBLEMS: Problem[] = [
  // Stoichiometry
  {
    id: 'stoich-1',
    category: 'Stoichiometry',
    difficulty: 'easy',
    question: 'How many moles of H₂O are produced when 4 moles of H₂ react with excess O₂?\n2H₂ + O₂ → 2H₂O',
    hints: ['Look at the mole ratio between H₂ and H₂O', 'The ratio is 2:2 or 1:1'],
    answer: '4 moles',
    solution: [
      'Given: 4 mol H₂, excess O₂',
      'Balanced equation: 2H₂ + O₂ → 2H₂O',
      'Mole ratio H₂:H₂O = 2:2 = 1:1',
      'mol H₂O = 4 mol H₂ × (2 mol H₂O / 2 mol H₂)',
      '= 4 mol H₂O',
    ],
    relatedCalculator: '/stoichiometry',
  },
  {
    id: 'stoich-2',
    category: 'Stoichiometry',
    difficulty: 'medium',
    question: 'What mass of CO₂ is produced when 50.0 g of CaCO₃ decomposes completely?\nCaCO₃ → CaO + CO₂\n(Molar masses: CaCO₃ = 100 g/mol, CO₂ = 44 g/mol)',
    hints: ['First convert mass to moles', 'Then use mole ratio 1:1', 'Finally convert moles to mass'],
    answer: '22.0 g',
    solution: [
      'Given: 50.0 g CaCO₃',
      'Step 1: mol CaCO₃ = 50.0 g ÷ 100 g/mol = 0.500 mol',
      'Step 2: Mole ratio CaCO₃:CO₂ = 1:1',
      'mol CO₂ = 0.500 mol',
      'Step 3: mass CO₂ = 0.500 mol × 44 g/mol = 22.0 g',
    ],
    relatedCalculator: '/stoichiometry',
  },
  {
    id: 'stoich-3',
    category: 'Stoichiometry',
    difficulty: 'hard',
    question: 'When 10.0 g of Al reacts with 15.0 g of Cl₂, what is the limiting reagent and how much AlCl₃ is produced?\n2Al + 3Cl₂ → 2AlCl₃\n(Molar masses: Al = 27 g/mol, Cl₂ = 71 g/mol, AlCl₃ = 133.5 g/mol)',
    hints: ['Convert both reactants to moles', 'Divide by stoichiometric coefficients', 'The smaller value indicates limiting reagent'],
    answer: 'Cl₂ is limiting; 18.8 g AlCl₃',
    solution: [
      'mol Al = 10.0 g ÷ 27 g/mol = 0.370 mol',
      'mol Cl₂ = 15.0 g ÷ 71 g/mol = 0.211 mol',
      'Divide by coefficients:',
      'Al: 0.370 ÷ 2 = 0.185',
      'Cl₂: 0.211 ÷ 3 = 0.0704 ← smaller, limiting',
      'mol AlCl₃ = 0.211 mol Cl₂ × (2/3) = 0.141 mol',
      'mass AlCl₃ = 0.141 mol × 133.5 g/mol = 18.8 g',
    ],
    relatedCalculator: '/stoichiometry',
  },

  // pH & Solutions
  {
    id: 'ph-1',
    category: 'pH & Solutions',
    difficulty: 'easy',
    question: 'What is the pH of a 0.001 M HCl solution? (Assume complete dissociation)',
    hints: ['HCl is a strong acid', '[H⁺] = 0.001 M = 10⁻³ M', 'pH = -log[H⁺]'],
    answer: 'pH = 3',
    solution: [
      'HCl is a strong acid, so [H⁺] = [HCl] = 0.001 M',
      '[H⁺] = 1 × 10⁻³ M',
      'pH = -log(10⁻³) = 3',
    ],
    relatedCalculator: '/solutions',
  },
  {
    id: 'ph-2',
    category: 'pH & Solutions',
    difficulty: 'medium',
    question: 'Calculate the pH of a buffer solution containing 0.20 M acetic acid (Ka = 1.8 × 10⁻⁵) and 0.30 M sodium acetate.',
    hints: ['Use Henderson-Hasselbalch equation', 'pKa = -log(Ka)', 'pH = pKa + log([A⁻]/[HA])'],
    answer: 'pH = 4.92',
    solution: [
      'Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])',
      'pKa = -log(1.8 × 10⁻⁵) = 4.74',
      '[A⁻] = 0.30 M (acetate)',
      '[HA] = 0.20 M (acetic acid)',
      'pH = 4.74 + log(0.30/0.20)',
      'pH = 4.74 + log(1.5)',
      'pH = 4.74 + 0.18 = 4.92',
    ],
    relatedCalculator: '/solutions',
  },
  {
    id: 'ph-3',
    category: 'pH & Solutions',
    difficulty: 'hard',
    question: 'How many mL of 0.50 M NaOH must be added to 500 mL of 0.20 M HCl to bring the pH to 7.0?',
    hints: ['At pH 7, solution is neutral', 'Need to neutralize all HCl', 'Use M₁V₁ = M₂V₂'],
    answer: '200 mL',
    solution: [
      'At pH 7, all HCl is neutralized',
      'mol HCl = 0.20 M × 0.500 L = 0.100 mol',
      'HCl + NaOH → NaCl + H₂O (1:1 ratio)',
      'Need 0.100 mol NaOH',
      'Volume NaOH = 0.100 mol ÷ 0.50 M = 0.200 L = 200 mL',
    ],
    relatedCalculator: '/solutions',
  },

  // Gas Laws
  {
    id: 'gas-1',
    category: 'Gas Laws',
    difficulty: 'easy',
    question: 'A gas occupies 2.0 L at 1.0 atm. What volume will it occupy at 2.0 atm? (Constant temperature)',
    hints: ["This is Boyle's Law: P₁V₁ = P₂V₂", 'Pressure and volume are inversely proportional'],
    answer: '1.0 L',
    solution: [
      "Boyle's Law: P₁V₁ = P₂V₂",
      '(1.0 atm)(2.0 L) = (2.0 atm)(V₂)',
      'V₂ = (1.0 × 2.0) / 2.0 = 1.0 L',
    ],
    relatedCalculator: '/gas-laws',
  },
  {
    id: 'gas-2',
    category: 'Gas Laws',
    difficulty: 'medium',
    question: 'How many moles of O₂ are in a 5.0 L container at 25°C and 2.0 atm?\n(R = 0.0821 L·atm/mol·K)',
    hints: ['Use ideal gas law: PV = nRT', 'Convert temperature to Kelvin', 'Solve for n'],
    answer: '0.41 mol',
    solution: [
      'PV = nRT',
      'T = 25 + 273 = 298 K',
      'n = PV/RT',
      'n = (2.0 atm × 5.0 L) / (0.0821 × 298)',
      'n = 10.0 / 24.5 = 0.41 mol',
    ],
    relatedCalculator: '/gas-laws',
  },
  {
    id: 'gas-3',
    category: 'Gas Laws',
    difficulty: 'hard',
    question: 'A mixture contains 2.0 g of H₂ and 8.0 g of O₂ in a 10.0 L container at 27°C. What is the total pressure?\n(R = 0.0821 L·atm/mol·K, M_H₂ = 2 g/mol, M_O₂ = 32 g/mol)',
    hints: ["Use Dalton's Law of Partial Pressures", 'Calculate moles of each gas', 'Find total moles, then use PV = nRT'],
    answer: '2.71 atm',
    solution: [
      'mol H₂ = 2.0 g / 2 g/mol = 1.0 mol',
      'mol O₂ = 8.0 g / 32 g/mol = 0.25 mol',
      'Total moles = 1.0 + 0.25 = 1.25 mol',
      'T = 27 + 273 = 300 K',
      'P = nRT/V',
      'P = (1.25 × 0.0821 × 300) / 10.0',
      'P = 30.8 / 10.0 = 3.08 atm',
    ],
    relatedCalculator: '/gas-laws',
  },

  // Kinetics
  {
    id: 'kinetics-1',
    category: 'Kinetics',
    difficulty: 'easy',
    question: 'A first-order reaction has a rate constant of 0.0693 s⁻¹. What is the half-life?',
    hints: ['For first-order: t₁/₂ = ln(2)/k', 'ln(2) ≈ 0.693'],
    answer: '10 s',
    solution: [
      'For first-order reactions:',
      't₁/₂ = ln(2)/k = 0.693/k',
      't₁/₂ = 0.693 / 0.0693 s⁻¹',
      't₁/₂ = 10 s',
    ],
    relatedCalculator: '/kinetics',
  },
  {
    id: 'kinetics-2',
    category: 'Kinetics',
    difficulty: 'medium',
    question: 'A reaction has a rate constant of 0.010 s⁻¹ at 300 K and 0.050 s⁻¹ at 320 K. Calculate the activation energy.\n(R = 8.314 J/mol·K)',
    hints: ['Use the two-temperature Arrhenius equation', 'ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)'],
    answer: 'Ea = 64 kJ/mol',
    solution: [
      'ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)',
      'ln(0.050/0.010) = (Ea/8.314)(1/300 - 1/320)',
      'ln(5) = (Ea/8.314)(0.00333 - 0.00313)',
      '1.609 = (Ea/8.314)(0.000208)',
      'Ea = 1.609 × 8.314 / 0.000208',
      'Ea = 64,300 J/mol = 64.3 kJ/mol',
    ],
    relatedCalculator: '/kinetics',
  },

  // Thermodynamics
  {
    id: 'thermo-1',
    category: 'Thermodynamics',
    difficulty: 'easy',
    question: 'Is a reaction spontaneous at 25°C if ΔH = -100 kJ and ΔS = +50 J/K?',
    hints: ['Calculate ΔG = ΔH - TΔS', 'Convert units to match', 'If ΔG < 0, reaction is spontaneous'],
    answer: 'Yes, ΔG = -114.9 kJ (spontaneous)',
    solution: [
      'ΔG = ΔH - TΔS',
      'T = 25 + 273 = 298 K',
      'ΔS = 50 J/K = 0.050 kJ/K',
      'ΔG = -100 kJ - (298 K)(0.050 kJ/K)',
      'ΔG = -100 - 14.9 = -114.9 kJ',
      'ΔG < 0, so the reaction is spontaneous',
    ],
    relatedCalculator: '/thermodynamics',
  },
  {
    id: 'thermo-2',
    category: 'Thermodynamics',
    difficulty: 'medium',
    question: 'At what temperature will a reaction become spontaneous if ΔH = +50 kJ and ΔS = +100 J/K?',
    hints: ['At the transition, ΔG = 0', 'Solve for T from 0 = ΔH - TΔS'],
    answer: 'T > 500 K (227°C)',
    solution: [
      'At the spontaneous/non-spontaneous boundary:',
      'ΔG = 0',
      '0 = ΔH - TΔS',
      'T = ΔH/ΔS',
      'T = 50,000 J / 100 J/K = 500 K',
      'Reaction is spontaneous when T > 500 K',
      'This is because both ΔH > 0 and ΔS > 0',
    ],
    relatedCalculator: '/thermodynamics',
  },

  // Electrochemistry
  {
    id: 'electro-1',
    category: 'Electrochemistry',
    difficulty: 'easy',
    question: 'Calculate the standard cell potential for:\nZn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)\n(E°Zn²⁺/Zn = -0.76 V, E°Cu²⁺/Cu = +0.34 V)',
    hints: ['E°cell = E°cathode - E°anode', 'Cu is reduced (cathode)', 'Zn is oxidized (anode)'],
    answer: 'E°cell = +1.10 V',
    solution: [
      'Cu²⁺ is reduced → cathode',
      'Zn is oxidized → anode',
      'E°cell = E°cathode - E°anode',
      'E°cell = +0.34 V - (-0.76 V)',
      'E°cell = +0.34 + 0.76 = +1.10 V',
    ],
    relatedCalculator: '/electrochemistry',
  },
  {
    id: 'electro-2',
    category: 'Electrochemistry',
    difficulty: 'medium',
    question: 'How many grams of Cu are deposited when 2.0 A flows for 1 hour through CuSO₄ solution?\n(Cu²⁺ + 2e⁻ → Cu, M_Cu = 63.5 g/mol, F = 96,485 C/mol)',
    hints: ["Use Faraday's law: m = MIt/nF", 'n = 2 electrons per Cu', 'Convert time to seconds'],
    answer: '2.37 g',
    solution: [
      'Q = It = 2.0 A × 3600 s = 7200 C',
      'mol electrons = Q/F = 7200/96,485 = 0.0746 mol',
      'mol Cu = 0.0746/2 = 0.0373 mol',
      'mass Cu = 0.0373 × 63.5 = 2.37 g',
    ],
    relatedCalculator: '/electrochemistry',
  },
]

// ============================================
// Component
// ============================================
export default function PracticePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null)
  const [showHints, setShowHints] = useState<Record<string, boolean>>({})
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({})
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set())

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(PROBLEMS.map(p => p.category))
    return ['all', ...Array.from(cats)]
  }, [])

  // Filter problems
  const filteredProblems = useMemo(() => {
    return PROBLEMS.filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false
      return true
    })
  }, [selectedCategory, selectedDifficulty])

  // Toggle hint
  const toggleHint = (id: string) => {
    setShowHints(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Toggle solution
  const toggleSolution = (id: string) => {
    setShowSolutions(prev => ({ ...prev, [id]: !prev[id] }))
    if (!showSolutions[id]) {
      setCompletedProblems(prev => new Set(prev).add(id))
    }
  }

  // Difficulty badge color (semantic: easy/medium/hard → success/warning/destructive)
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/10 text-success border-success/30'
      case 'medium': return 'bg-warning/10 text-warning-strong border-warning/40'
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <CalcShell
      eyebrow={`Practice · ${PROBLEMS.length} worked problems`}
      title="Practice Problems"
      subtitle="Test your chemistry skills with worked, step-by-step problems across core topics."
      backHref="/"
      backLabel="Home"
      maxWidth="5xl"
      action={
        <div className="text-sm text-muted-foreground">
          <span className="text-success font-semibold">{completedProblems.size} completed</span>
          {' · '}
          {PROBLEMS.length} total
        </div>
      }
    >
      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat === 'all' ? 'All Topics' : cat}
              </button>
            ))}
          </div>

          {/* Difficulty Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'easy', 'medium', 'hard'].map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  selectedDifficulty === diff
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems.map((problem) => (
          <Card
            key={problem.id}
            className={`transition-colors ${
              completedProblems.has(problem.id) ? 'border-l-2 border-l-success' : ''
            }`}
          >
            {/* Problem Header */}
            <button
              onClick={() => setExpandedProblem(expandedProblem === problem.id ? null : problem.id)}
              className="w-full p-6 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {problem.category}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    {completedProblems.has(problem.id) && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success border border-success/30">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-foreground font-medium whitespace-pre-line">
                    {problem.question}
                  </p>
                </div>
                <span className="text-2xl text-muted-foreground" aria-hidden="true">
                  {expandedProblem === problem.id ? '−' : '+'}
                </span>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedProblem === problem.id && (
              <div className="px-6 pb-6 space-y-4">
                {/* Hints */}
                <div>
                  <button
                    onClick={() => toggleHint(problem.id)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {showHints[problem.id] ? 'Hide hints' : 'Show hints'}
                  </button>
                  {showHints[problem.id] && (
                    <ul className="mt-2 space-y-1 text-muted-foreground text-sm pl-4">
                      {problem.hints.map((hint, i) => (
                        <li key={i}>• {hint}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Solution */}
                <div>
                  <button
                    onClick={() => toggleSolution(problem.id)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {showSolutions[problem.id] ? 'Hide solution' : 'Show solution'}
                  </button>
                  {showSolutions[problem.id] && (
                    <div className="mt-3 p-4 bg-muted border border-border rounded-md">
                      <div className="text-success font-bold mb-3 text-lg">
                        Answer: {problem.answer}
                      </div>
                      <div className="space-y-1 text-foreground text-sm font-mono">
                        {problem.solution.map((step, i) => (
                          <div key={i}>{step}</div>
                        ))}
                      </div>
                      <Link
                        href={problem.relatedCalculator}
                        className="inline-block mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                      >
                        Try this in calculator →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProblems.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <p className="text-xl mb-2 text-foreground">No problems found</p>
          <p>Try changing the filters.</p>
        </Card>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {PROBLEMS.length} problems across {categories.length - 1} topics.
      </p>
    </CalcShell>
  )
}
