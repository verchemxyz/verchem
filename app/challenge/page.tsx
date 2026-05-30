'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CalcShell, Card, Button } from '@/components/lab'
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

  // Shuffle questions on game start using deterministic method
  const startGame = useCallback(() => {
    // Use date-based deterministic shuffle for consistent daily challenges
    const today = new Date().toDateString()
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    // Fisher-Yates shuffle with deterministic seed
    const questions = [...QUESTIONS]
    for (let i = questions.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1)
      ;[questions[i], questions[j]] = [questions[j], questions[i]]
    }
    
    const shuffled = questions.slice(0, 10)
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
      case 'easy': return 'text-success-strong bg-success/10'
      case 'medium': return 'text-warning-strong bg-warning/10'
      case 'hard': return 'text-destructive-strong bg-destructive/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const shareScore = () => {
    const text = `I scored ${score} points on VerChem Chemistry Challenge! Can you beat my score?\n\nhttps://verchem.xyz/challenge`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Score copied to clipboard!')
    }
  }

  return (
    <CalcShell
      eyebrow="Chemistry challenge · 10 questions · 5 min"
      title="Chemistry Challenge"
      subtitle="Test your chemistry knowledge with 10 random questions. Build streaks and earn bonus points."
      backHref="/"
      backLabel="Home"
      maxWidth="4xl"
      action={
        gameState === 'playing' ? (
          <div className="flex items-center gap-6 text-foreground">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <span className={`font-mono text-lg ${timeLeft < 60 ? 'text-destructive-strong' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <span className="font-bold font-mono">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${streak > 0 ? 'text-primary-600' : 'text-muted-foreground'}`} aria-hidden="true" />
              <span className={streak > 0 ? 'text-primary-600 font-bold font-mono' : 'text-muted-foreground font-mono'}>{streak}x</span>
            </div>
          </div>
        ) : undefined
      }
    >
      {/* Ready State */}
      {gameState === 'ready' && (
        <>
          <div className="text-center py-4">
            <Button onClick={startGame} className="text-lg px-10 py-5">
              <Zap className="h-5 w-5 mr-2" aria-hidden="true" />
              Start Challenge
            </Button>
          </div>

          {/* How it works */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Target, title: '10 Questions', desc: 'Random mix of chemistry topics' },
              { icon: Timer, title: '5 Minutes', desc: 'Race against the clock' },
              { icon: Flame, title: 'Build Streaks', desc: 'Consecutive answers = bonus points' },
            ].map((item) => (
              <Card key={item.title} className="p-6 text-center">
                <item.icon className="h-9 w-9 text-primary-600 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* Leaderboard Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Today&apos;s Top Scores
            </h2>
            <div className="space-y-3">
              {MOCK_LEADERBOARD.slice(0, 5).map((entry, i) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between p-3 rounded-md bg-muted border border-border"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm ${
                      i === 0 ? 'bg-primary-500 text-primary-foreground' :
                      i < 3 ? 'bg-primary-500/20 text-primary-700' :
                      'bg-card border border-border text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-foreground font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-muted-foreground text-sm font-mono">{entry.time}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Flame className="h-4 w-4" aria-hidden="true" />
                      {entry.streak}
                    </span>
                    <span className="text-foreground font-bold font-mono">{entry.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Playing State */}
      {gameState === 'playing' && shuffledQuestions.length > 0 && (
        <>
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentQuestion + 1} of {shuffledQuestions.length}</span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${getDifficultyColor(shuffledQuestions[currentQuestion].difficulty)}`}>
                {shuffledQuestions[currentQuestion].difficulty.toUpperCase()} (+{shuffledQuestions[currentQuestion].points})
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted border border-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyColor(shuffledQuestions[currentQuestion].difficulty)}`}>
                {shuffledQuestions[currentQuestion].type.replace('-', ' ').toUpperCase()}
              </span>
              {streak > 0 && (
                <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-600 flex items-center gap-1">
                  <Flame className="h-3 w-3" aria-hidden="true" />
                  {streak}x Streak!
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-8">
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
                    className={`w-full rounded-md p-4 text-left font-medium transition-colors ${
                      showResult
                        ? isCorrect
                          ? 'bg-success/10 border-2 border-success text-success-strong'
                          : isSelected
                          ? 'bg-destructive/10 border-2 border-destructive text-destructive-strong'
                          : 'bg-muted border border-border text-muted-foreground'
                        : isSelected
                        ? 'bg-primary-500/10 border-2 border-primary-500 text-foreground'
                        : 'bg-card border border-border text-foreground hover:bg-muted hover:border-primary-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        showResult
                          ? isCorrect
                            ? 'bg-success text-success-foreground'
                            : isSelected
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-card border border-border'
                          : 'bg-muted border border-border'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-success-strong" aria-hidden="true" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive-strong" aria-hidden="true" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 p-4 rounded-md bg-muted border border-border">
                <p className="text-foreground">
                  <span className="text-primary-600 font-semibold">Explanation:</span> {shuffledQuestions[currentQuestion].explanation}
                </p>
              </div>
            )}

            {/* Next Button */}
            {showExplanation && (
              <Button onClick={nextQuestion} className="mt-6 w-full">
                {currentQuestion >= shuffledQuestions.length - 1 ? 'See Results' : 'Next Question'}
                <ArrowRight className="inline-block ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            )}
          </Card>
        </>
      )}

      {/* Finished State */}
      {gameState === 'finished' && (
        <>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/10 border border-primary-500/30 mb-6">
              <Trophy className="h-10 w-10 text-primary-600" aria-hidden="true" />
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-4">Challenge Complete</h2>

            <div className="font-mono text-5xl md:text-6xl font-bold text-foreground mb-8">
              {score} <span className="text-2xl text-muted-foreground">points</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-success-strong mx-auto mb-2" aria-hidden="true" />
              <p className="text-2xl font-bold font-mono text-foreground">{answeredQuestions.filter(q => q.correct).length}/{answeredQuestions.length}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </Card>
            <Card className="p-4 text-center">
              <Target className="h-6 w-6 text-primary-600 mx-auto mb-2" aria-hidden="true" />
              <p className="text-2xl font-bold font-mono text-foreground">{getAccuracy()}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </Card>
            <Card className="p-4 text-center">
              <Flame className="h-6 w-6 text-primary-600 mx-auto mb-2" aria-hidden="true" />
              <p className="text-2xl font-bold font-mono text-foreground">{maxStreak}x</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </Card>
            <Card className="p-4 text-center">
              <Timer className="h-6 w-6 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
              <p className="text-2xl font-bold font-mono text-foreground">{formatTime(300 - timeLeft)}</p>
              <p className="text-xs text-muted-foreground">Time Used</p>
            </Card>
          </div>

          {/* Performance Badge */}
          <Card className="p-6 text-center">
            <Medal className="h-14 w-14 mx-auto mb-4 text-primary-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {score >= 1500 ? 'Chemistry Master!' :
               score >= 1000 ? 'Chemistry Expert!' :
               score >= 500 ? 'Chemistry Student!' :
               'Keep Practicing!'}
            </h2>
            <p className="text-muted-foreground">
              {score >= 1500 ? 'Outstanding performance! You really know your chemistry!' :
               score >= 1000 ? 'Great job! You have solid chemistry knowledge!' :
               score >= 500 ? 'Good effort! Keep studying to improve!' :
               'Don\'t give up! Practice makes perfect!'}
            </p>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={startGame} className="px-8">
              <RotateCcw className="h-5 w-5 mr-2" aria-hidden="true" />
              Play Again
            </Button>
            <Button variant="secondary" onClick={shareScore} className="px-8">
              <Share2 className="h-5 w-5 mr-2" aria-hidden="true" />
              Share Score
            </Button>
          </div>

          {/* Question Review */}
          <div className="pt-6">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Question Review
            </h3>
            <div className="space-y-3">
              {answeredQuestions.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-md p-4 border ${
                    item.correct
                      ? 'bg-success/10 border-success/30'
                      : 'bg-destructive/10 border-destructive/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.correct ? (
                      <CheckCircle className="h-5 w-5 text-success-strong flex-shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive-strong flex-shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div>
                      <p className="text-foreground font-medium">{item.question.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Correct: {item.question.options[item.question.correctAnswer]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </CalcShell>
  )
}
