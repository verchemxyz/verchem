/**
 * VerChem AI Verified Answer Card Orchestrator
 *
 * Claude Haiku 4.5 tool-use loop.
 * Invariant: Every numeric claim must trace to a tool_result.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AnswerCard, ToolCall } from './types'
import { signCard } from './signature'
import { ALL_TOOLS, TOOL_BY_NAME, toAnthropicTool } from './tools/registry'

const MODEL = 'claude-haiku-4-5-20251001'
const VERSION = 'w3-v1'
const MAX_TOKENS = 1500
const MAX_ROUNDS = 5

const SYSTEM_PROMPT = `You are the VerChem verification assistant. Your job is to understand chemistry questions and explain answers using ONLY numbers produced by deterministic calculation engines.

CRITICAL RULES:
1. You MUST NOT calculate any numbers yourself. When a question can be answered with a tool, you MUST call the appropriate tool.
2. Use ONLY numbers from tool results in your explanation. Never invent, estimate, or hallucinate numeric values.
3. If no available tool matches the question (e.g., purely conceptual questions), give a concise conceptual explanation and state that numerical verification is not available.
4. If a tool returns an error, explain why the calculation could not be performed.
5. Be concise but thorough. Cite the textbook reference when a tool is used.
6. Respond in the same language the user asked in.`

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

    if (toolUseBlocks.length === 0) {
      // No more tool calls — Claude is done
      if (!hasText && response.stop_reason === 'max_tokens') {
        explanation += '\n\n(Response truncated due to token limit.)'
      }
      break
    }

    // Execute tools and build tool_result messages
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

    for (const block of toolUseBlocks) {
      const tool = TOOL_BY_NAME.get(block.name)
      const result = tool
        ? tool.execute(block.input as Record<string, unknown>)
        : { ok: false, value: {}, error: `Tool "${block.name}" not found` } as const

      // Store tool call for the card
      toolCalls.push({
        name: block.name,
        engine: tool?.engine || 'unknown',
        input: block.input as Record<string, unknown>,
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
  }

  const verified = toolCalls.some((tc) => tc.result.ok)

  const payload = {
    question,
    tool_calls: toolCalls.map((tc) => ({
      name: tc.name,
      input: tc.input,
      result: tc.result.ok ? tc.result.value : { error: tc.result.error },
    })),
    model: MODEL,
    version: VERSION,
    issued_at: new Date().toISOString(),
  }

  const signature = await signCard(payload)

  return {
    question,
    verified,
    tool_calls: toolCalls,
    explanation: explanation.trim(),
    model: MODEL,
    version: VERSION,
    issued_at: payload.issued_at,
    signature,
  }
}
