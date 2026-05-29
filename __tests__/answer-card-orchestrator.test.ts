/**
 * VerChem Answer Card Orchestrator Tests (W3 production hardening)
 *
 * The Claude tool-use loop was previously never exercised in tests ("not yet
 * smoke-tested against the API shape"). These tests inject a FAKE Anthropic
 * client that mimics the real API response shape, so the orchestration loop —
 * tool execution against the REAL deterministic engines, status derivation,
 * signing, and the new error-handling paths — is covered deterministically.
 *
 * Covered:
 *  - conceptual (no tool) → unverified
 *  - single tool then prose → verified, real engine numbers, signed
 *  - Claude API failure before any tool → throws typed AnswerServiceError
 *  - Claude API failure AFTER a verified result → graceful PARTIAL card
 *  - classifyServiceError mapping for every Anthropic error class
 */

import assert from 'node:assert/strict'
import Anthropic, {
  APIError,
  RateLimitError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
} from '@anthropic-ai/sdk'
import {
  askVerified,
  classifyServiceError,
  AnswerServiceError,
} from '@/lib/answer-cards/orchestrator'

// ---------- tiny runner ----------
let passed = 0
let failed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    passed++
    console.log('  ✓', name)
  } catch (e) {
    failed++
    console.error('  ✗', name)
    console.error('   ', e instanceof Error ? e.message : e)
  }
}

// ---------- fake Anthropic client ----------
type ContentBlock = Record<string, unknown>

function makeMessage(
  content: ContentBlock[],
  stop_reason: Anthropic.Messages.Message['stop_reason'] = 'end_turn'
): Anthropic.Messages.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-haiku-4-5-20251001',
    content,
    stop_reason,
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 10 },
  } as unknown as Anthropic.Messages.Message
}

const text = (t: string): ContentBlock => ({ type: 'text', text: t })
const toolUse = (name: string, input: unknown, id = 'tu_test'): ContentBlock => ({
  type: 'tool_use',
  id,
  name,
  input,
})

type Step = Anthropic.Messages.Message | (() => never)
function makeFakeClient(steps: Step[]): Anthropic {
  let i = 0
  return {
    messages: {
      create: async () => {
        const step = steps[Math.min(i, steps.length - 1)]
        i++
        if (typeof step === 'function') return step()
        return step
      },
    },
  } as unknown as Anthropic
}

async function run() {
  console.log('answer-card-orchestrator')

  // --- conceptual: no tool calls ---
  await test('conceptual question (no tool) → unverified + signed', async () => {
    const client = makeFakeClient([
      makeMessage([text('This is a conceptual question about reaction mechanisms.')]),
    ])
    const card = await askVerified('Why are SN2 reactions stereospecific?', { client })
    assert.equal(card.status, 'unverified')
    assert.equal(card.verified, false)
    assert.equal(card.tool_calls.length, 0)
    assert.ok(card.signature.length > 0, 'card must be signed')
    assert.ok(card.explanation.length > 0)
  })

  // --- happy path: tool then prose, real engine numbers ---
  await test('strong-acid pH question → verified, real engine pH=1, signed, audit clean', async () => {
    const client = makeFakeClient([
      makeMessage([toolUse('calculate_strong_acid_ph', { concentration: 0.1, formula: 'HCl' })], 'tool_use'),
      makeMessage([text('This is strongly acidic because HCl dissociates completely in water.')]),
    ])
    const card = await askVerified('What is the pH of 0.1 M HCl?', { client })
    assert.equal(card.status, 'verified')
    assert.equal(card.verified, true)
    assert.equal(card.tool_calls.length, 1)
    assert.equal(card.tool_calls[0].name, 'calculate_strong_acid_ph')
    assert.equal(card.tool_calls[0].result.ok, true)
    const pH = card.tool_calls[0].result.value.pH as number
    assert.ok(Math.abs(pH - 1) < 0.01, `expected pH≈1, got ${pH}`)
    assert.equal(card.audit.clean, true, 'qualitative prose must produce a clean audit')
    assert.ok(card.signature.length > 0)
  })

  // --- service error BEFORE any verified result → throw typed error ---
  await test('Claude rate-limit on first call → throws AnswerServiceError(rate_limit, 429)', async () => {
    const client = makeFakeClient([
      () => {
        throw new RateLimitError(429, undefined, 'rate limited', new Headers())
      },
    ])
    await assert.rejects(
      () => askVerified('pH of 0.1 M HCl?', { client }),
      (err: unknown) =>
        err instanceof AnswerServiceError && err.kind === 'rate_limit' && err.httpStatus === 429
    )
  })

  // --- service error AFTER a verified result → graceful partial card ---
  await test('Claude connection drop AFTER a verified tool result → PARTIAL card (results preserved)', async () => {
    const client = makeFakeClient([
      makeMessage([toolUse('calculate_strong_acid_ph', { concentration: 0.1, formula: 'HCl' })], 'tool_use'),
      () => {
        throw new APIConnectionError({ message: 'socket hang up' })
      },
    ])
    const card = await askVerified('What is the pH of 0.1 M HCl?', { client })
    assert.equal(card.status, 'partial')
    assert.equal(card.verified, false)
    assert.equal(card.tool_calls.length, 1)
    assert.equal(card.tool_calls[0].result.ok, true)
    assert.match(card.explanation, /temporary service issue/i)
    assert.ok(card.signature.length > 0, 'even a partial card is signed')
  })

  // --- classifyServiceError mapping ---
  await test('classifyServiceError maps every Anthropic error class correctly', () => {
    const cases: Array<[unknown, AnswerServiceError['kind'], number]> = [
      [new RateLimitError(429, undefined, 'x', new Headers()), 'rate_limit', 429],
      [new APIConnectionTimeoutError({ message: 't' }), 'timeout', 504],
      [new APIConnectionError({ message: 'c' }), 'connection', 503],
      [new AuthenticationError(401, undefined, 'a', new Headers()), 'auth', 503],
      [new APIError(529, undefined, 'overloaded', new Headers()), 'overloaded', 503],
      [new APIError(400, undefined, 'bad', new Headers()), 'bad_request', 502],
      [new APIError(500, undefined, 'srv', new Headers()), 'server', 502],
      [new Error('ANTHROPIC_API_KEY is not configured'), 'auth', 503],
      [new Error('something weird'), 'unknown', 500],
    ]
    for (const [input, kind, status] of cases) {
      const svc = classifyServiceError(input)
      assert.equal(svc.kind, kind, `kind for ${String(input)}`)
      assert.equal(svc.httpStatus, status, `status for ${String(input)}`)
      assert.ok(svc.publicMessage.length > 0)
      // public message must never leak provider internals
      assert.doesNotMatch(svc.publicMessage, /anthropic|api key|token/i)
    }
  })

  // --- idempotency of classify (AnswerServiceError passes through) ---
  await test('classifyServiceError is idempotent on AnswerServiceError', () => {
    const original = classifyServiceError(new RateLimitError(429, undefined, 'x', new Headers()))
    const again = classifyServiceError(original)
    assert.equal(again, original)
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

run()
