/**
 * AI Problem Generator - API Endpoint
 *
 * POST /api/problems/generate
 *
 * Generates chemistry problems validated by our calculators
 * This is what makes us different from ChatGPT!
 *
 * SECURITY (Dec 2025):
 * - Rate limiting: 20 requests/minute per user
 * - Input validation with strict bounds
 *
 * Last Updated: 2025-12-12
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateProblem,
  generateProblems,
  type ProblemGenerationRequest,
  type ProblemCategory,
  type DifficultyLevel,
} from '@/lib/ai-problems'
import { checkRateLimit, getClientId, RATE_LIMITS } from '@/lib/rate-limit'

// Validate request body
function validateRequest(body: unknown): ProblemGenerationRequest | null {
  if (!body || typeof body !== 'object') return null

  const { category, difficulty, count, excludeIds } = body as Record<string, unknown>

  // Validate category
  const validCategories: ProblemCategory[] = [
    'stoichiometry',
    'ph-solutions',
    'gas-laws',
    'thermodynamics',
    'kinetics',
    'electrochemistry',
    'equation-balancing',
    'molar-mass',
  ]

  if (!category || !validCategories.includes(category as ProblemCategory)) {
    return null
  }

  // Validate difficulty
  const validDifficulties = [1, 2, 3, 4, 5]
  if (!difficulty || !validDifficulties.includes(difficulty as number)) {
    return null
  }

  return {
    category: category as ProblemCategory,
    difficulty: difficulty as DifficultyLevel,
    count: typeof count === 'number' ? Math.min(count, 10) : 1,
    excludeIds: Array.isArray(excludeIds) ? excludeIds : undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - SECURITY
    const clientId = getClientId(request)
    const rateLimit = checkRateLimit(`problems:${clientId}`, RATE_LIMITS.problemGenerator)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Please wait ${rateLimit.retryAfter} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const body = await request.json()
    const validatedRequest = validateRequest(body)

    if (!validatedRequest) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Please provide valid category (ph-solutions, gas-laws, etc.) and difficulty (1-5)',
        },
        { status: 400 }
      )
    }

    // Generate problems
    const problems =
      validatedRequest.count === 1
        ? [generateProblem(validatedRequest)]
        : generateProblems(validatedRequest)

    return NextResponse.json({
      success: true,
      problems,
      count: problems.length,
      category: validatedRequest.category,
      difficulty: validatedRequest.difficulty,
    })
  } catch (error) {
    console.error('Problem generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate problem', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint - return available categories and difficulties
export async function GET() {
  return NextResponse.json({
    categories: [
      { id: 'ph-solutions', name: 'pH & Solutions', icon: '🧪' },
      { id: 'stoichiometry', name: 'Stoichiometry', icon: '⚖️' },
      { id: 'gas-laws', name: 'Gas Laws', icon: '💨' },
      { id: 'thermodynamics', name: 'Thermodynamics', icon: '🔥' },
      { id: 'kinetics', name: 'Kinetics', icon: '⏱️' },
      { id: 'electrochemistry', name: 'Electrochemistry', icon: '⚡' },
      { id: 'molar-mass', name: 'Molar Mass', icon: '🔢' },
    ],
    difficulties: [
      { level: 1, label: 'Easy', points: 100 },
      { level: 2, label: 'Medium', points: 150 },
      { level: 3, label: 'Hard', points: 200 },
      { level: 4, label: 'Expert', points: 300 },
      { level: 5, label: 'Master', points: 500 },
    ],
  })
}
