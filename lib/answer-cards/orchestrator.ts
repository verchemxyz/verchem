/**
 * VerChem AI Verified Answer Card Orchestrator
 *
 * Claude Haiku 4.5 tool-use loop.
 * Invariant: Every numeric claim must trace to a tool_result.
 * W3-R2: Status enum, numeric audit, incomplete tracking, input guard.
 */

import Anthropic, {
  APIError,
  RateLimitError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  PermissionDeniedError,
} from '@anthropic-ai/sdk'
import type { AnswerCard, CardStatus, ToolCall, VerifiedTool } from './types'
import { signCard, toSignablePayload } from './signature'
import { auditExplanation } from './audit'
import { ALL_TOOLS, TOOL_BY_NAME, toAnthropicTool } from './tools/registry'
import { isPlainObject } from './tools/_validate'

/**
 * Strip input object to only keys defined in the tool's input_schema.properties.
 * Prevents LLM from smuggling fake numbers via unused fields that would enter
 * the audit allowlist (e.g., {concentration: 0.1, unused_hallucination: 999}).
 */
export function pickSchemaKeys(
  input: Record<string, unknown>,
  tool: VerifiedTool | undefined
): Record<string, unknown> {
  if (!tool) return input
  const schema = tool.input_schema as Record<string, unknown>
  const properties = schema.properties as Record<string, unknown> | undefined
  if (!properties || typeof properties !== 'object' || properties === null) return input
  const allowed = Object.keys(properties)
  const stripped: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in input) {
      stripped[key] = input[key]
    }
  }
  return stripped
}

const MODEL = 'claude-haiku-4-5-20251001'
const VERSION = 'w3-v1'
const MAX_TOKENS = 1500
const MAX_ROUNDS = 5

export type AnswerServiceErrorKind =
  | 'rate_limit'
  | 'overloaded'
  | 'timeout'
  | 'connection'
  | 'auth'
  | 'bad_request'
  | 'server'
  | 'unknown'

/**
 * Typed failure of the verification *service* (the Claude API call itself),
 * as opposed to a chemistry calculation error (which is captured in a card).
 * Carries a user-safe public message + the HTTP status the route should return.
 * Never leaks provider internals to the client.
 */
export class AnswerServiceError extends Error {
  readonly kind: AnswerServiceErrorKind
  readonly httpStatus: number
  readonly publicMessage: string

  constructor(
    kind: AnswerServiceErrorKind,
    httpStatus: number,
    publicMessage: string,
    cause?: unknown
  ) {
    super(publicMessage)
    this.name = 'AnswerServiceError'
    this.kind = kind
    this.httpStatus = httpStatus
    this.publicMessage = publicMessage
    if (cause !== undefined) {
      ;(this as { cause?: unknown }).cause = cause
    }
  }
}

/**
 * Map an unknown thrown value (typically an Anthropic SDK error) to a typed,
 * user-safe AnswerServiceError. Auth/permission errors are deliberately
 * presented as a generic "temporarily unavailable" so a misconfiguration never
 * exposes that the API key is bad.
 */
export function classifyServiceError(err: unknown): AnswerServiceError {
  if (err instanceof AnswerServiceError) return err

  if (err instanceof RateLimitError) {
    return new AnswerServiceError(
      'rate_limit',
      429,
      'The verification service is busy right now. Please try again in a moment.',
      err
    )
  }
  if (err instanceof APIConnectionTimeoutError) {
    return new AnswerServiceError(
      'timeout',
      504,
      'The verification service took too long to respond. Please try again.',
      err
    )
  }
  if (err instanceof APIConnectionError) {
    return new AnswerServiceError(
      'connection',
      503,
      'Could not reach the verification service. Please try again.',
      err
    )
  }
  if (err instanceof AuthenticationError || err instanceof PermissionDeniedError) {
    return new AnswerServiceError(
      'auth',
      503,
      'The verification service is temporarily unavailable.',
      err
    )
  }
  if (err instanceof APIError) {
    const status = typeof err.status === 'number' ? err.status : 0
    if (status === 529) {
      return new AnswerServiceError(
        'overloaded',
        503,
        'The verification service is overloaded. Please try again shortly.',
        err
      )
    }
    if (status === 400 || status === 422) {
      return new AnswerServiceError(
        'bad_request',
        502,
        'The verification service could not process this request. Please rephrase your question.',
        err
      )
    }
    return new AnswerServiceError(
      'server',
      502,
      'The verification service returned an error. Please try again.',
      err
    )
  }

  // Includes the "ANTHROPIC_API_KEY is not configured" startup error.
  if (err instanceof Error && err.message.includes('ANTHROPIC_API_KEY')) {
    return new AnswerServiceError('auth', 503, 'The verification service is not configured.', err)
  }

  return new AnswerServiceError(
    'unknown',
    500,
    'An unexpected error occurred while verifying your question.',
    err
  )
}

const SYSTEM_PROMPT = `You are the VerChem verification assistant. Your job is to understand chemistry questions and explain answers using ONLY numbers produced by deterministic calculation engines.

CRITICAL RULES:
1. You MUST NOT calculate any numbers yourself. When a question can be answered with a tool, you MUST call the appropriate tool.
2. Keep your explanation qualitative. Do NOT write any numeric values in your explanation — not results, not citations, not chapter numbers, not percentages. Describe the chemistry conceptually (e.g., "strongly acidic because it fully dissociates", "spontaneous under standard conditions"). All numeric values and citations are shown separately in the verified Engine Results.
3. Never invent, estimate, or hallucinate numeric values.
4. If no available tool matches the question (e.g., purely conceptual questions), give a concise conceptual explanation and state that numerical verification is not available.
5. If a tool returns an error, explain why the calculation could not be performed.
6. Be concise but thorough.
7. Respond in the same language the user asked in.`

/**
 * Determine card status based on engine results and completeness ONLY.
 * Audit on prose is informational — never gates verified status.
 * VERIFIED means: at least one engine produced a deterministic result,
 * no engine errors, and the response is complete.
 */
export function determineStatus(
  hasOk: boolean,
  hasError: boolean,
  allFailed: boolean,
  incomplete: boolean
): CardStatus {
  if (allFailed) return 'error'
  if (!hasOk) return 'unverified'
  if (hasError || incomplete) return 'partial'
  return 'verified'
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  return new Anthropic({ apiKey })
}

export interface AskVerifiedOptions {
  /**
   * Inject an Anthropic client. Defaults to an env-configured client.
   * Used by unit tests (fake client) and the live smoke test (real client).
   */
  client?: Anthropic
}

export async function askVerified(
  question: string,
  opts: AskVerifiedOptions = {}
): Promise<AnswerCard> {
  const client = opts.client ?? getAnthropicClient()
  const tools = ALL_TOOLS.map(toAnthropicTool)

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: question },
  ]

  const toolCalls: ToolCall[] = []
  let explanation = ''
  let rounds = 0
  let incomplete = false
  let serviceInterrupted = false

  while (rounds < MAX_ROUNDS) {
    rounds++

    let response: Anthropic.Messages.Message
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
        tools: tools.length > 0 ? tools : undefined,
      })
    } catch (err) {
      // The Claude API call failed. If we already have at least one verified
      // engine result, degrade gracefully to a PARTIAL card — the signed
      // engine results remain authoritative even without the AI narrative.
      // Otherwise there is nothing to return: surface a typed service error.
      if (toolCalls.some((tc) => tc.result.ok)) {
        incomplete = true
        serviceInterrupted = true
        break
      }
      throw classifyServiceError(err)
    }

    // Collect tool_use requests
    const toolUseBlocks: Anthropic.Messages.ToolUseBlock[] = []
    let hasText = false
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        toolUseBlocks.push(block)
      } else if (block.type === 'text') {
        hasText = true
        explanation += block.text
      }
    }

    // Track incompleteness
    if (response.stop_reason === 'max_tokens') {
      incomplete = true
    }
    if (toolUseBlocks.length === 0) {
      // No more tool calls — Claude is done
      if (!hasText && response.stop_reason === 'max_tokens') {
        explanation += '\n\n(Response truncated due to token limit.)'
      }
      break
    }

    // If max_tokens hit while tool_use still pending → incomplete
    if (response.stop_reason === 'max_tokens') {
      incomplete = true
      break
    }

    // Execute tools and build tool_result messages
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

    for (const block of toolUseBlocks) {
      const tool = TOOL_BY_NAME.get(block.name)

      // Input guard: block.input must be a plain object
      if (!isPlainObject(block.input)) {
        const badInputResult = {
          ok: false,
          value: {},
          error: `Tool input must be a plain object, received ${Array.isArray(block.input) ? 'array' : typeof block.input}`,
        } as const
        toolCalls.push({
          name: block.name,
          engine: tool?.engine || 'unknown',
          input: { raw: String(block.input) },
          result: badInputResult,
          citation: tool?.citation || '',
        })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(badInputResult),
          is_error: true,
        })
        continue
      }

      // Strip input to schema-defined keys only (prevent LLM smuggling via unused fields)
      const strippedInput = pickSchemaKeys(block.input as Record<string, unknown>, tool)

      const result = tool
        ? tool.execute(strippedInput)
        : { ok: false, value: {}, error: `Tool "${block.name}" not found` } as const

      // Store tool call for the card
      toolCalls.push({
        name: block.name,
        engine: tool?.engine || 'unknown',
        input: strippedInput,
        result,
        citation: tool?.citation || '',
      })

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
        is_error: !result.ok,
      })
    }

    // Append assistant message (with tool uses) and tool results
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    // If we hit max rounds with pending tool_use, mark incomplete
    if (rounds >= MAX_ROUNDS && toolUseBlocks.length > 0) {
      incomplete = true
    }
  }

  // Numeric audit (informational — does NOT gate status)
  const audit = auditExplanation(explanation, toolCalls)

  // Determine status: engine-driven, audit-independent
  const hasOk = toolCalls.some((tc) => tc.result.ok)
  const hasError = toolCalls.some((tc) => !tc.result.ok)
  const allFailed = toolCalls.length > 0 && !hasOk

  const status = determineStatus(hasOk, hasError, allFailed, incomplete)

  if (serviceInterrupted) {
    explanation +=
      '\n\n(The AI explanation could not be completed due to a temporary service issue. The verified engine results above are complete and authoritative.)'
  } else if (incomplete && !explanation.includes('(Response may be incomplete.)')) {
    explanation += '\n\n(Response may be incomplete.)'
  }

  // Build the card, then sign it through the shared payload builder so signing
  // and later verification (load / public share) are guaranteed symmetric.
  const card: AnswerCard = {
    question,
    status,
    verified: status === 'verified',
    tool_calls: toolCalls,
    explanation: explanation.trim(),
    audit,
    model: MODEL,
    version: VERSION,
    issued_at: new Date().toISOString(),
    signature: '',
  }

  card.signature = await signCard(toSignablePayload(card))
  return card
}
