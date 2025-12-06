'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Trophy,
  Timer,
  Flame,
  Star,
  Zap,
  CheckCircle,
  XCircle,
  ArrowRight,
  Share2,
  RotateCcw,
  Sparkles,
  Target,
  Medal,
  TrendingUp
} from 'lucide-react'

interface Question {
  id: number
  type: 'balance' | 'molar-mass' | 'ph' | 'stoichiometry' | 'element'
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
}

const QUESTIONS: Question[] = [
  // Equation Balancing
  {
    id: 1,
    type: 'balance',
    question: 'Balance the equation: H₂ + O₂ → H₂O',
    options: ['2H₂ + O₂ → 2H₂O', 'H₂ + O₂ → H₂O', '2H₂ + 2O₂ → 2H₂O', 'H₂ + 2O₂ → 2H₂O'],
    correctAnswer: 0,
    explanation: 'We need 2 hydrogen molecules and 1 oxygen molecule to make 2 water molecules, balancing both H (4 atoms) and O (2 atoms).',
    difficulty: 'easy',
    points: 100
  },
  {
    id: 2,
    type: 'balance',
    question: 'Balance: Fe + O₂ → Fe₂O₃',
    options: ['2Fe + O₂ → Fe₂O₃', '4Fe + 3O₂ → 2Fe₂O₃', '3Fe + 2O₂ → Fe₂O₃', 'Fe + 3O₂ → 2Fe₂O₃'],
    correctAnswer: 1,
    explanation: 'The correct balance is 4Fe + 3O₂ → 2Fe₂O₃. This gives 4 Fe atoms and 6 O atoms on each side.',
    difficulty: 'medium',
    points: 150
  },
  // Molar Mass
  {
    id: 3,
    type: 'molar-mass',
    question: 'What is the molar mass of H₂O?',
    options: ['16.00 g/mol', '18.02 g/mol', '20.00 g/mol', '17.01 g/mol'],
    correctAnswer: 1,
    explanation: 'H₂O = 2(1.008) + 15.999 = 18.015 ≈ 18.02 g/mol',
    difficulty: 'easy',
    points: 100
  },
  {
    id: 4,
    type: 'molar-mass',
    question: 'What is the molar mass of C₆H₁₂O₆ (glucose)?',
    options: ['160 g/mol', '180 g/mol', '200 g/mol', '170 g/mol'],
    correctAnswer: 1,
    explanation: 'Glucose: 6(12.01) + 12(1.008) + 6(15.999) = 72.06 + 12.10 + 95.99 = 180.16 g/mol',
    difficulty: 'medium',
    points: 150
  },
  // pH
  {
    id: 5,
    type: 'ph',
    question: 'A solution has [H⁺] = 1×10⁻³ M. What is its pH?',
    options: ['3', '4', '11', '7'],
    correctAnswer: 0,
    explanation: 'pH = -log[H⁺] = -log(1×10⁻³) = 3',
    difficulty: 'easy',
    points: 100
  },
  {
    id: 6,
    type: 'ph',
    question: 'What is the pOH of a solution with pH = 9?',
    options: ['5', '9', '14', '7'],
    correctAnswer: 0,
    explanation: 'pH + pOH = 14, so pOH = 14 - 9 = 5',
    difficulty: 'easy',
    points: 100
  },
  // Elements
  {
    id: 7,
    type: 'element',
    question: 'What is the atomic number of Carbon?',
    options: ['5', '6', '7', '12'],
    correctAnswer: 1,
    explanation: 'Carbon (C) has atomic number 6, meaning it has 6 protons in its nucleus.',
    difficulty: 'easy',
    points: 100
  },
  {
    id: 8,
    type: 'element',
    question: 'Which element has the electron configuration [Ne] 3s² 3p⁵?',
    options: ['Chlorine', 'Argon', 'Sulfur', 'Phosphorus'],
    correctAnswer: 0,
    explanation: 'Chlorine (Cl, Z=17) has 7 electrons in the third shell, configuration [Ne] 3s² 3p⁵.',
    difficulty: 'medium',
    points: 150
  },
  // Stoichiometry
  {
    id: 9,
    type: 'stoichiometry',
    question: 'In 2H₂ + O₂ → 2H₂O, how many moles of H₂O form from 3 mol O₂?',
    options: ['3 mol', '6 mol', '1.5 mol', '2 mol'],
    correctAnswer: 1,
    explanation: 'The ratio is 1 O₂ : 2 H₂O, so 3 mol O₂ produces 6 mol H₂O.',
    difficulty: 'medium',
    points: 150
  },
  {
    id: 10,
    type: 'stoichiometry',
    question: 'If 90% yield, and theoretical yield is 100g, what is actual yield?',
    options: ['100g', '90g', '110g', '80g'],
    correctAnswer: 1,
    explanation: 'Actual yield = (% yield / 100) × theoretical = 0.90 × 100 = 90g',
    difficulty: 'easy',
    points: 100
  },
  // Hard questions
  {
    id: 11,
    type: 'balance',
    question: 'Balance: C₃H₈ + O₂ → CO₂ + H₂O',
    options: ['C₃H₈ + 5O₂ → 3CO₂ + 4H₂O', 'C₃H₈ + 4O₂ → 3CO₂ + 4H₂O', '2C₃H₈ + 10O₂ → 6CO₂ + 8H₂O', 'C₃H₈ + 6O₂ → 3CO₂ + 4H₂O'],
    correctAnswer: 0,
    explanation: 'Propane combustion: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. Balances C (3), H (8), and O (10).',
    difficulty: 'hard',
    points: 200
  },
  {
    id: 12,
    type: 'element',
    question: 'Which element is the most electronegative?',
    options: ['Oxygen', 'Chlorine', 'Fluorine', 'Nitrogen'],
    correctAnswer: 2,
    explanation: 'Fluorine (F) has the highest electronegativity value of 3.98 on the Pauling scale.',
    difficulty: 'medium',
    points: 150
  },
]

interface LeaderboardEntry {
  name: string
  score: number
  streak: number
  time: string
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'ChemMaster99', score: 2450, streak: 12, time: '2:15' },
  { name: 'ReactionKing', score: 2100, streak: 8, time: '2:45' },
  { name: 'MoleCalculator', score: 1950, streak: 7, time: '3:00' },
  { name: 'pH_Wizard', score: 1800, streak: 6, time: '3:20' },
  { name: 'PeriodicPro', score: 1650, streak: 5, time: '3:45' },
]

export default function ChemistryChallengePage() {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<{ correct: boolean; question: Question }[]>([])
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])

  // Shuffle questions on game start
  const startGame = useCallback(() => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
    setShuffledQuestions(shuffled)
    setGameState('playing')
    setCurrentQuestion(0)
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setTimeLeft(300)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setAnsweredQuestions([])
  }, [])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, timeLeft])

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || showExplanation) return

    setSelectedAnswer(answerIndex)
    const question = shuffledQuestions[currentQuestion]
    const isCorrect = answerIndex === question.correctAnswer

    if (isCorrect) {
      const multiplier = 1 + (streak * 0.1) // 10% bonus per streak
      const timeBonus = Math.floor(timeLeft / 30) * 10 // Time bonus
      const points = Math.floor(question.points * multiplier) + timeBonus
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      setMaxStreak(prev => Math.max(prev, streak + 1))
    } else {
      setStreak(0)
    }

    setAnsweredQuestions(prev => [...prev, { correct: isCorrect, question }])
    setShowExplanation(true)
  }

  const nextQuestion = () => {
    if (currentQuestion >= shuffledQuestions.length - 1) {
      setGameState('finished')
    } else {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAccuracy = () => {
    if (answeredQuestions.length === 0) return 0
    return Math.round((answeredQuestions.filter(q => q.correct).length / answeredQuestions.length) * 100)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'hard': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400'
    }
  }

  const shareScore = () => {
    const text = `I scored ${score} points on VerChem Chemistry Challenge! Can you beat my score? 🧪⚗️\n\nhttps://verchem.xyz/challenge`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Score copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Sparkles className="h-6 w-6 text-violet-400" />
            VerChem Challenge
          </Link>

          {gameState === 'playing' && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white">
                <Timer className="h-5 w-5 text-violet-400" />
                <span className={`font-mono text-lg ${timeLeft < 60 ? 'text-red-400 animate-pulse' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-400' : 'text-gray-500'}`} />
                <span className={streak > 0 ? 'text-orange-400 font-bold' : 'text-gray-500'}>{streak}x</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Ready State */}
      {gameState === 'ready' && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 mb-6">
              <Trophy className="h-4 w-4" />
              Daily Chemistry Challenge
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Chemistry
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                Challenge
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Test your chemistry knowledge with 10 random questions.
              Build streaks, earn bonus points, and climb the leaderboard!
            </p>

            <button
              onClick={startGame}
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-10 py-5 text-xl font-bold text-white transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105"
            >
              <Zap className="h-6 w-6" />
              Start Challenge
            </button>
          </div>

          {/* How it works */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {[
              { icon: Target, title: '10 Questions', desc: 'Random mix of chemistry topics' },
              { icon: Timer, title: '5 Minutes', desc: 'Race against the clock' },
              { icon: Flame, title: 'Build Streaks', desc: 'Consecutive answers = bonus points' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <item.icon className="h-10 w-10 text-violet-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Leaderboard Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Today&apos;s Top Scores
            </h2>
            <div className="space-y-3">
              {MOCK_LEADERBOARD.slice(0, 5).map((entry, i) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-yellow-500 text-black' :
                      i === 1 ? 'bg-gray-400 text-black' :
                      i === 2 ? 'bg-amber-600 text-white' :
                      'bg-white/10 text-white'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-white font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 text-sm">{entry.time}</span>
                    <span className="flex items-center gap-1 text-orange-400">
                      <Flame className="h-4 w-4" />
                      {entry.streak}
                    </span>
                    <span className="text-yellow-400 font-bold">{entry.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Playing State */}
      {gameState === 'playing' && shuffledQuestions.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Question {currentQuestion + 1} of {shuffledQuestions.length}</span>
              <span className={getDifficultyColor(shuffledQuestions[currentQuestion].difficulty)}>
                {shuffledQuestions[currentQuestion].difficulty.toUpperCase()} (+{shuffledQuestions[currentQuestion].points})
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-slate-900/90 to-violet-900/20 p-8 shadow-2xl shadow-violet-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyColor(shuffledQuestions[currentQuestion].difficulty)}`}>
                {shuffledQuestions[currentQuestion].type.replace('-', ' ').toUpperCase()}
              </span>
              {streak > 0 && (
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-400 flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {streak}x Streak!
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-8">
              {shuffledQuestions[currentQuestion].question}
            </h2>

            <div className="space-y-3">
              {shuffledQuestions[currentQuestion].options.map((option, i) => {
                const isSelected = selectedAnswer === i
                const isCorrect = i === shuffledQuestions[currentQuestion].correctAnswer
                const showResult = showExplanation

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showExplanation}
                    className={`w-full rounded-xl p-4 text-left font-medium transition-all ${
                      showResult
                        ? isCorrect
                          ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                          : isSelected
                          ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                          : 'bg-white/5 border border-white/10 text-slate-400'
                        : isSelected
                        ? 'bg-violet-500/20 border-2 border-violet-500 text-white'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        showResult
                          ? isCorrect
                            ? 'bg-green-500 text-white'
                            : isSelected
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10'
                          : 'bg-white/10'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-400" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-400" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p className="text-slate-300">
                  <span className="text-violet-400 font-semibold">Explanation:</span> {shuffledQuestions[currentQuestion].explanation}
                </p>
              </div>
            )}

            {/* Next Button */}
            {showExplanation && (
              <button
                onClick={nextQuestion}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 font-bold text-white transition-all hover:from-violet-500 hover:to-fuchsia-500"
              >
                {currentQuestion >= shuffledQuestions.length - 1 ? 'See Results' : 'Next Question'}
                <ArrowRight className="inline-block ml-2 h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Finished State */}
      {gameState === 'finished' && (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 mb-6">
              <Trophy className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">Challenge Complete!</h1>

            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-8">
              {score} Points
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{answeredQuestions.filter(q => q.correct).length}/{answeredQuestions.length}</p>
              <p className="text-xs text-slate-400">Correct</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <Target className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{getAccuracy()}%</p>
              <p className="text-xs text-slate-400">Accuracy</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <Flame className="h-6 w-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{maxStreak}x</p>
              <p className="text-xs text-slate-400">Best Streak</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <Timer className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{formatTime(300 - timeLeft)}</p>
              <p className="text-xs text-slate-400">Time Used</p>
            </div>
          </div>

          {/* Performance Badge */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center mb-8">
            <Medal className={`h-16 w-16 mx-auto mb-4 ${
              score >= 1500 ? 'text-yellow-400' :
              score >= 1000 ? 'text-gray-300' :
              score >= 500 ? 'text-amber-600' :
              'text-gray-500'
            }`} />
            <h2 className="text-xl font-bold text-white mb-2">
              {score >= 1500 ? 'Chemistry Master!' :
               score >= 1000 ? 'Chemistry Expert!' :
               score >= 500 ? 'Chemistry Student!' :
               'Keep Practicing!'}
            </h2>
            <p className="text-slate-400">
              {score >= 1500 ? 'Outstanding performance! You really know your chemistry!' :
               score >= 1000 ? 'Great job! You have solid chemistry knowledge!' :
               score >= 500 ? 'Good effort! Keep studying to improve!' :
               'Don\'t give up! Practice makes perfect!'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startGame}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 font-bold text-white transition-all hover:from-violet-500 hover:to-fuchsia-500"
            >
              <RotateCcw className="h-5 w-5" />
              Play Again
            </button>
            <button
              onClick={shareScore}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-8 py-4 font-bold text-white transition-all hover:bg-white/20"
            >
              <Share2 className="h-5 w-5" />
              Share Score
            </button>
          </div>

          {/* Question Review */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              Question Review
            </h3>
            <div className="space-y-3">
              {answeredQuestions.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border ${
                    item.correct
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.correct ? (
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-white font-medium">{item.question.question}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Correct: {item.question.options[item.question.correctAnswer]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
