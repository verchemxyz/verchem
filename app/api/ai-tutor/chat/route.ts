/**
 * AI Chemistry Tutor - Chat API Endpoint
 *
 * POST /api/ai-tutor/chat
 *
 * Handles AI tutor conversations with context injection
 * Uses Claude Haiku for cost efficiency, Sonnet for complex topics
 *
 * Last Updated: 2025-12-02
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import {
  AI_TUTOR_LIMITS,
  CHEMISTRY_TUTOR_SYSTEM_PROMPT,
  shouldUseSonnet,
  buildContextPrompt,
} from '@/lib/ai-tutor'
import type { AiTutorChatRequest, CalculatorContext } from '@/lib/ai-tutor'
import type { SubscriptionTier } from '@/lib/vercal/types'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Session verification helper
async function verifySession(): Promise<{
  userId: string
  tier: SubscriptionTier
} | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('verchem-session')

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)

    // Check expiry
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      return null
    }

    return {
      userId: sessionData.user?.sub || sessionData.user?.id || 'anonymous',
      tier: (sessionData.user?.subscription?.tier as SubscriptionTier) || 'free',
    }
  } catch {
    return null
  }
}

// Usage tracking (in-memory for now, should be in database)
const usageCache = new Map<string, { count: number; resetDate: Date }>()

function getUsage(userId: string): { count: number; resetDate: Date } {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const cached = usageCache.get(userId)

  // Reset if new month
  if (!cached || cached.resetDate < monthStart) {
    const usage = { count: 0, resetDate: nextMonth }
    usageCache.set(userId, usage)
    return usage
  }

  return cached
}

function incrementUsage(userId: string): void {
  const usage = getUsage(userId)
  usage.count++
  usageCache.set(userId, usage)
}

// Build full system prompt with context
function buildSystemPrompt(context?: CalculatorContext): string {
  let prompt = CHEMISTRY_TUTOR_SYSTEM_PROMPT

  if (context) {
    prompt += '\n\n---\n\n'
    prompt += buildContextPrompt(context)
    prompt += '\n\n---\n\nThe student is asking about this calculation. '
    prompt += 'Use the context above to provide a personalized explanation.'
  }

  return prompt
}

// Select model based on query complexity
function selectModel(message: string, context?: CalculatorContext): string {
  if (shouldUseSonnet(message, context?.calculatorId)) {
    return 'claude-sonnet-4-20250514'
  }
  return 'claude-3-haiku-20240307'
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI tutor not configured', code: 'API_ERROR' },
        { status: 500 }
      )
    }

    // 2. Verify authentication
    const session = await verifySession()

    // Allow anonymous users with free tier
    const userId = session?.userId || `anon-${request.headers.get('x-forwarded-for') || 'unknown'}`
    const tier: SubscriptionTier = session?.tier || 'free'

    // 3. Check usage quota
    const limits = AI_TUTOR_LIMITS[tier]
    const usage = getUsage(userId)

    if (usage.count >= limits.queriesPerMonth) {
      return NextResponse.json(
        {
          error: 'Query limit reached',
          code: 'RATE_LIMIT',
          remaining: 0,
          resetDate: usage.resetDate,
          upgradePrompt:
            tier === 'free'
              ? 'Upgrade to Student tier for 100 queries/month!'
              : 'You have reached your monthly limit.',
        },
        { status: 429 }
      )
    }

    // 4. Parse request
    const body: AiTutorChatRequest = await request.json()
    const { message, context, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    // 5. Build system prompt with context
    const systemPrompt = buildSystemPrompt(context)

    // 6. Select model
    const model = selectModel(message, context)

    // 7. Format conversation history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: message },
    ]

    // 8. Call Claude API
    const response = await anthropic.messages.create({
      model,
      max_tokens: limits.maxTokensPerQuery,
      system: systemPrompt,
      messages,
    })

    // 9. Increment usage
    incrementUsage(userId)

    // 10. Extract response
    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // 11. Return response
    return NextResponse.json({
      response: assistantMessage,
      remaining: limits.queriesPerMonth - usage.count - 1,
      model: model.includes('haiku') ? 'haiku' : 'sonnet',
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    })
  } catch (error) {
    console.error('AI Tutor error:', error)

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable',
          code: 'API_ERROR',
          details: error.message,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'API_ERROR' },
      { status: 500 }
    )
  }
}

// GET endpoint for usage info
export async function GET() {
  try {
    const session = await verifySession()
    const userId = session?.userId || 'anonymous'
    const tier: SubscriptionTier = session?.tier || 'free'

    const limits = AI_TUTOR_LIMITS[tier]
    const usage = getUsage(userId)

    return NextResponse.json({
      tier,
      queriesUsed: usage.count,
      queriesLimit: limits.queriesPerMonth,
      queriesRemaining: Math.max(0, limits.queriesPerMonth - usage.count),
      resetDate: usage.resetDate,
      isAuthenticated: !!session,
    })
  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json({ error: 'Failed to get usage' }, { status: 500 })
  }
}
