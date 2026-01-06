'use client'

/**
 * AI Practice Mode - Unlimited Chemistry Problems
 *
 * Key Feature: Problems validated by OUR calculators!
 * This is what makes us different from ChatGPT!
 *
 * Last Updated: 2025-12-02
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Brain,
  Sparkles,
  Target,
  Trophy,
  Flame,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronRight,
  Beaker,
  Wind,
  Thermometer,
  Clock,
  Zap,
  Calculator,
} from 'lucide-react'
import type { GeneratedProblem, ProblemCategory, DifficultyLevel } from '@/lib/ai-problems'
import { DIFFICULTY_CONFIGS } from '@/lib/ai-problems'

// Category configurations
const CATEGORIES: Array<{
  id: ProblemCategory
  name: string
  icon: React.ReactNode
  color: string
  description: string
}> = [
  {
    id: 'ph-solutions',
    name: 'pH & Solutions',
    icon: <Beaker className="h-5 w-5" />,
    color: 'from-blue-500 to-cyan-500',
    description: 'Strong/weak acids & bases, buffers, dilution',
  },
  {
    id: 'gas-laws',
    name: 'Gas Laws',
    icon: <Wind className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500',
    description: 'Ideal gas, combined gas law, partial pressures',
  },
  {
    id: 'stoichiometry',
    name: 'Stoichiometry',
    icon: <Calculator className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-500',
    description: 'Mole conversions, limiting reagent, yield',
  },
  {
    id: 'thermodynamics',
    name: 'Thermodynamics',
    icon: <Thermometer className="h-5 w-5" />,
    color: 'from-orange-500 to-red-500',
    description: 'Gibbs free energy, spontaneity, equilibrium',
  },
  {
    id: 'kinetics',
    name: 'Kinetics',
    icon: <Clock className="h-5 w-5" />,
    color: 'from-yellow-500 to-amber-500',
    description: 'Rate laws, half-life, Arrhenius equation',
  },
]

export default function AIPracticePage() {
  // State
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(2)
  const [problem, setProblem] = useState<GeneratedProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showHints, setShowHints] = useState<number>(0) // 0, 1, 2, or 3
  const [result, setResult] = useState<{
    isCorrect: boolean
    feedback: string
    percentError: number
    pointsEarned: number
  } | null>(null)
  const [stats, setStats] = useState({
    attempted: 0,
    correct: 0,
    streak: 0,
    totalPoints: 0,
  })
  const [startTime, setStartTime] = useState<Date | null>(null)

  // Generate new problem
  const generateNewProblem = useCallback(async () => {
    if (!selectedCategory) return

    setIsLoading(true)
    setProblem(null)
    setResult(null)
    setUserAnswer('')
    setShowHints(0)

    try {
      const response = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          difficulty,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate problem')

      const data = await response.json()
      setProblem(data.problems[0])
      setStartTime(new Date())
    } catch (error) {
      console.error('Error generating problem:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, difficulty])

  // Submit answer
  const submitAnswer = async () => {
    if (!problem || !userAnswer.trim()) return

    const timeTaken = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0
    const numericAnswer = parseFloat(userAnswer)

    if (isNaN(numericAnswer)) {
      setResult({
        isCorrect: false,
        feedback: 'Please enter a valid number.',
        percentError: 100,
        pointsEarned: 0,
      })
      return
    }

    try {
      const response = await fetch('/api/problems/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          userAnswer: numericAnswer,
          timeTaken,
          hintsUsed: showHints,
        }),
      })

      if (!response.ok) throw new Error('Validation failed')

      const data = await response.json()

      setResult({
        isCorrect: data.isCorrect,
        feedback: data.feedback,
        percentError: data.percentError,
        pointsEarned: data.pointsEarned,
      })

      // Update stats
      setStats((prev) => ({
        attempted: prev.attempted + 1,
        correct: prev.correct + (data.isCorrect ? 1 : 0),
        streak: data.isCorrect ? prev.streak + 1 : 0,
        totalPoints: prev.totalPoints + data.pointsEarned,
      }))
    } catch (error) {
      console.error('Validation error:', error)
    }
  }

  // Show next hint
  const showNextHint = () => {
    if (problem && showHints < 3) {
      setShowHints(showHints + 1)
    }
  }

  // Get difficulty color
  const getDifficultyColor = (level: DifficultyLevel): string => {
    const colors: Record<DifficultyLevel, string> = {
      1: 'bg-green-100 text-green-700 border-green-300',
      2: 'bg-blue-100 text-blue-700 border-blue-300',
      3: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      4: 'bg-orange-100 text-orange-700 border-orange-300',
      5: 'bg-red-100 text-red-700 border-red-300',
    }
    return colors[level]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm dark:bg-gray-900/90 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">VerChem</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Practice</p>
            </div>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {stats.totalPoints} pts
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {stats.streak} streak
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-green-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {stats.correct}/{stats.attempted}
              </span>
            </div>
          </div>

          <Link
            href="/practice"
            className="px-4 py-2 text-gray-600 hover:text-purple-600 transition-colors font-medium dark:text-gray-400"
          >
            ← Standard Practice
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4 dark:bg-purple-900/30 dark:text-purple-300">
            <Brain className="h-4 w-4" />
            <span>Unlimited AI-Generated Problems</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI Practice Mode
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
            Infinite practice problems validated by our calculators.
            <span className="font-semibold text-purple-600"> Not possible with ChatGPT!</span>
          </p>
        </div>

        {/* Category Selection */}
        {!selectedCategory ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Choose a Topic
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-800"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                  />
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} text-white mb-4`}
                  >
                    {cat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{cat.description}</p>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back & Difficulty */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setProblem(null)
                  setResult(null)
                }}
                className="text-gray-600 hover:text-purple-600 flex items-center gap-1 dark:text-gray-400"
              >
                ← Change Topic
              </button>

              {/* Difficulty Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Difficulty:</span>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        difficulty === level
                          ? getDifficultyColor(level) + ' ring-2 ring-offset-2 ring-purple-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {DIFFICULTY_CONFIGS[level].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Problem Area */}
            {!problem ? (
              <div className="text-center py-12">
                <button
                  onClick={generateNewProblem}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Problem
                    </>
                  )}
                </button>
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Click to generate a {DIFFICULTY_CONFIGS[difficulty].label.toLowerCase()} problem
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Problem Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden dark:bg-gray-800">
                  {/* Problem Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        <span className="font-semibold">
                          {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}
                      >
                        {DIFFICULTY_CONFIGS[problem.difficulty].label}
                      </span>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">
                      {problem.question}
                    </h3>

                    {problem.context && (
                      <p className="text-sm text-gray-600 mb-4 italic dark:text-gray-400">
                        {problem.context}
                      </p>
                    )}

                    {/* Given Data */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 dark:bg-gray-700">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">
                        Given:
                      </h4>
                      <ul className="space-y-1">
                        {Object.entries(problem.givenData).map(([key, val]) => (
                          <li key={key} className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-mono">
                              {key} = {val.value} {val.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Hints */}
                    {showHints > 0 && (
                      <div className="space-y-2 mb-6">
                        {problem.hints.slice(0, showHints).map((hint, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                          >
                            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              Hint {idx + 1}: {hint}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer Input */}
                    {!result && (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                            placeholder={`Enter your answer (${problem.expectedAnswer.unit})`}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={submitAnswer}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                          >
                            Check
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={showNextHint}
                            disabled={showHints >= 3}
                            className="text-sm text-purple-600 hover:text-purple-700 disabled:text-gray-400 flex items-center gap-1"
                          >
                            <Lightbulb className="h-4 w-4" />
                            {showHints < 3 ? `Show Hint (${3 - showHints} left)` : 'No more hints'}
                          </button>
                          <span className="text-xs text-gray-500">
                            Formula: {problem.formula}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Result */}
                    {result && (
                      <div className="space-y-4">
                        <div
                          className={`p-4 rounded-lg ${
                            result.isCorrect
                              ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                              : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {result.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span
                              className={`font-semibold ${result.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                            >
                              {result.isCorrect ? 'Correct!' : 'Not quite...'}
                            </span>
                            {result.isCorrect && (
                              <span className="ml-auto text-sm font-medium text-green-600">
                                +{result.pointsEarned} points
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm ${result.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                          >
                            {result.feedback}
                          </p>

                          {!result.isCorrect && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              Expected: {problem.expectedAnswer.value} {problem.expectedAnswer.unit}
                            </p>
                          )}
                        </div>

                        {/* Solution Steps (show if wrong) */}
                        {!result.isCorrect && (
                          <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-700">
                            <h4 className="font-semibold text-gray-900 mb-2 dark:text-white">
                              Solution:
                            </h4>
                            <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              {problem.solutionSteps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Next Problem */}
                        <div className="flex gap-4">
                          <button
                            onClick={generateNewProblem}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                          >
                            Next Problem
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm dark:bg-green-900/30 dark:text-green-300">
            <Zap className="h-4 w-4" />
            <span>
              All problems validated by VerChem calculators -
              <span className="font-semibold"> guaranteed accuracy!</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
