/**
 * AI Problem Generator - Answer Validation API
 *
 * POST /api/problems/validate
 *
 * Validates user answers using our calculators
 *
 * Last Updated: 2025-12-02
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAnswer, type GeneratedProblem } from '@/lib/ai-problems'

interface ValidateRequest {
  problem: GeneratedProblem
  userAnswer: number
  timeTaken?: number // seconds
  hintsUsed?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json()

    if (!body.problem || typeof body.userAnswer !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Please provide problem and userAnswer' },
        { status: 400 }
      )
    }

    const { problem, userAnswer, timeTaken = 0, hintsUsed = 0 } = body

    // Validate answer
    const result = validateAnswer(problem, userAnswer)

    // Calculate points
    let pointsEarned = 0
    if (result.isCorrect) {
      const basePoints = problem.expectedAnswer.value ? 100 : 0
      const difficultyMultiplier = problem.difficulty
      const hintPenalty = hintsUsed * 10
      const timeBonus = timeTaken < 30 ? 20 : timeTaken < 60 ? 10 : 0

      pointsEarned = Math.max(0, basePoints * difficultyMultiplier - hintPenalty + timeBonus)
    }

    return NextResponse.json({
      success: true,
      ...result,
      pointsEarned,
      expectedAnswer: problem.expectedAnswer.value,
      expectedUnit: problem.expectedAnswer.unit,
      tolerance: problem.expectedAnswer.tolerance,
      solutionSteps: result.isCorrect ? null : problem.solutionSteps,
      formula: problem.formula,
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Validation failed', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
