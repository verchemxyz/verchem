/**
 * AI Problem Generator - Answer Validation API
 *
 * POST /api/problems/validate
 *
 * Validates user answers using our calculators
 *
 * SECURITY (Dec 2025 - 4-AI Audit):
 * - Rate limiting to prevent abuse
 * - Input size limits to prevent DoS
 *
 * Last Updated: 2025-12-12
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAnswer, type GeneratedProblem } from '@/lib/ai-problems'
import { checkRateLimit, getClientId, RATE_LIMITS } from '@/lib/rate-limit'

// Maximum request body size (prevent DoS)
const MAX_BODY_SIZE = 10 * 1024 // 10KB

interface ValidateRequest {
  problem: GeneratedProblem
  userAnswer: number
  timeTaken?: number // seconds
  hintsUsed?: number
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientId(request)
    const rateLimit = checkRateLimit(`validate:${clientId}`, RATE_LIMITS.problemValidator)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) }
        }
      )
    }

    // Check content length to prevent DoS
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request too large', maxSize: MAX_BODY_SIZE },
        { status: 413 }
      )
    }

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
