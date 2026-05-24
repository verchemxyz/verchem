/**
 * VerChem AI Verified Answer Card Orchestrator
 *
 * Claude Haiku 4.5 tool-use loop.
 * Invariant: Every numeric claim must trace to a tool_result.
 * W3-R2: Status enum, numeric audit, incomplete tracking, input guard.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AnswerCard, CardStatus, ToolCall, VerifiedTool } from './types'
import { signCard } from './signature'
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

const SYSTEM_PROMPT = `You are the VerChem verification assistant. Your job is to understand chemistry questions and explain answers using ONLY numbers produced by deterministic calculation engines.

CRITICAL RULES:
1. You MUST NOT calculate any numbers yourself. When a question can be answered with a tool, you MUST call the appropriate tool.
2. Keep your explanation qualitative. Do NOT write any numeric values in your explanation — not results, not citations, not chapter numbers, not percentages. Describe the chemistry conceptually (e.g., "strongly acidic because it fully dissociates", "spontaneous under standard conditions"). All numeric values and citations are shown separately in the verified Engine Results.
3. Never invent, estimate, or hallucinate numeric values.
4. If no available tool matches the question (e.g., purely conceptual questions), give a concise conceptual explanation and state that numerical verification is not available.
5. If a tool returns an error, explain why the calculation could not be performed.
6. Be concise but thorough.
7. Respond in the same language the user asked in.`

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  return new Anthropic({ apiKey })
}

export async function askVerified(question: string): Promise<AnswerCard> {
  const client = getAnthropicClient()
  const tools = ALL_TOOLS.map(toAnthropicTool)

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: question },
  ]

  const toolCalls: ToolCall[] = []
  let explanation = ''
  let rounds = 0
  let incomplete = false

  while (rounds < MAX_ROUNDS) {
    rounds++

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    })

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

  // Numeric audit
  const audit = auditExplanation(explanation, toolCalls)

  // Determine status
  const hasOk = toolCalls.some((tc) => tc.result.ok)
  const hasError = toolCalls.some((tc) => !tc.result.ok)
  const allFailed = toolCalls.length > 0 && !hasOk

  let status: CardStatus
  if (allFailed) {
    status = 'error'
  } else if (!hasOk) {
    status = 'unverified'
  } else if (hasError || incomplete || !audit.clean) {
    status = 'partial'
  } else {
    status = 'verified'
  }

  if (incomplete && !explanation.includes('(Response may be incomplete.)')) {
    explanation += '\n\n(Response may be incomplete.)'
  }

  const payload = {
    question,
    status,
    tool_calls: toolCalls.map((tc) => ({
      name: tc.name,
      engine: tc.engine,
      input: tc.input,
      result: tc.result,
      citation: tc.citation,
    })),
    explanation: explanation.trim(),
    audit,
    model: MODEL,
    version: VERSION,
    issued_at: new Date().toISOString(),
  }

  const signature = await signCard(payload)

  return {
    question,
    status,
    verified: status === 'verified',
    tool_calls: toolCalls,
    explanation: explanation.trim(),
    audit,
    model: MODEL,
    version: VERSION,
    issued_at: payload.issued_at,
    signature,
  }
}
