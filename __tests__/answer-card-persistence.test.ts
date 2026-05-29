/**
 * VerChem Answer Card Persistence — signature trust-anchor tests (W3 Day 4)
 *
 * These cover the security-critical logic the persistence layer relies on,
 * WITHOUT importing the `server-only` Supabase module:
 *  - a freshly signed card survives a JSON round-trip (client send-back) and verifies
 *  - tampering ANY signed field breaks the signature → save would be rejected
 *  - the stored canonical-string path (verifyCanonicalSignature) is byte-faithful
 *    and detects corruption — this is what makes a loaded card's badge honest
 *  - parseSubmittedCard rejects malformed / oversized / junk-signature input
 */

import assert from 'node:assert/strict'
import Anthropic from '@anthropic-ai/sdk'
import { askVerified } from '@/lib/answer-cards/orchestrator'
import {
  verifyCardSignature,
  verifyCanonicalSignature,
  canonicalPayloadString,
  toSignablePayload,
} from '@/lib/answer-cards/signature'
import { parseSubmittedCard } from '@/lib/answer-cards/validate-card'
import { isValidSignablePayload } from '@/lib/answer-cards/payload-shape'
import type { AnswerCard } from '@/lib/answer-cards/types'

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

function makeMessage(content: Record<string, unknown>[], stop = 'end_turn') {
  return {
    id: 'm',
    type: 'message',
    role: 'assistant',
    model: 'claude-haiku-4-5-20251001',
    content,
    stop_reason: stop,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Anthropic.Messages.Message
}
function fakeClient(steps: Anthropic.Messages.Message[]): Anthropic {
  let i = 0
  return {
    messages: { create: async () => steps[Math.min(i++, steps.length - 1)] },
  } as unknown as Anthropic
}

/** Generate a real, signed card via the orchestration loop + a fake client. */
async function makeSignedCard(): Promise<AnswerCard> {
  const client = fakeClient([
    makeMessage(
      [{ type: 'tool_use', id: 't1', name: 'calculate_strong_acid_ph', input: { concentration: 0.1, formula: 'HCl' } }],
      'tool_use'
    ),
    makeMessage([{ type: 'text', text: 'Strongly acidic; HCl fully dissociates.' }]),
  ])
  return askVerified('pH of 0.1 M HCl?', { client })
}

/** Simulate the client sending the card back as JSON, then server re-parsing it. */
function roundTrip(card: AnswerCard): AnswerCard | null {
  return parseSubmittedCard(JSON.parse(JSON.stringify(card)))
}

async function run() {
  console.log('answer-card-persistence')

  await test('signed card survives JSON round-trip + parse and still verifies', async () => {
    const card = await makeSignedCard()
    assert.equal(card.status, 'verified')
    const parsed = roundTrip(card)
    assert.ok(parsed, 'parse must succeed')
    const ok = await verifyCardSignature(toSignablePayload(parsed!), parsed!.signature)
    assert.equal(ok, true, 'round-tripped card must verify (save would be accepted)')
  })

  await test('tampering a tool RESULT value breaks the signature', async () => {
    const card = await makeSignedCard()
    const t = roundTrip(card)!
    ;(t.tool_calls[0].result.value as Record<string, unknown>).pH = 99 // forge the answer
    const ok = await verifyCardSignature(toSignablePayload(t), t.signature)
    assert.equal(ok, false, 'forged pH must fail verification (save rejected)')
  })

  await test('tampering the EXPLANATION breaks the signature', async () => {
    const card = await makeSignedCard()
    const t = roundTrip(card)!
    t.explanation = t.explanation + ' (the pH is actually basic)'
    const ok = await verifyCardSignature(toSignablePayload(t), t.signature)
    assert.equal(ok, false)
  })

  await test('upgrading STATUS partial→verified breaks the signature', async () => {
    const card = await makeSignedCard()
    const t = roundTrip(card)!
    t.status = 'partial' // any change to a signed field
    const ok = await verifyCardSignature(toSignablePayload(t), t.signature)
    assert.equal(ok, false)
  })

  await test('stored canonical string round-trips byte-faithfully and detects corruption', async () => {
    const card = await makeSignedCard()
    const canonical = canonicalPayloadString(toSignablePayload(card))
    assert.equal(await verifyCanonicalSignature(canonical, card.signature), true)

    // Edit the stored payload directly (simulate a row tampered in the DB).
    const corrupted = canonical.replace('"verified"', '"tampered"')
    assert.notEqual(corrupted, canonical, 'sanity: corruption actually changed the string')
    assert.equal(
      await verifyCanonicalSignature(corrupted, card.signature),
      false,
      'a corrupted stored payload must NOT verify → loaded card shows TAMPERED'
    )
  })

  await test('reconstruct-from-canonical preserves the signable fields', async () => {
    const card = await makeSignedCard()
    const canonical = canonicalPayloadString(toSignablePayload(card))
    const parsed = JSON.parse(canonical)
    assert.equal(parsed.question, card.question)
    assert.equal(parsed.status, card.status)
    assert.equal(parsed.tool_calls[0].result.value.pH, card.tool_calls[0].result.value.pH)
  })

  await test('parseSubmittedCard rejects malformed input', () => {
    assert.equal(parseSubmittedCard(null), null)
    assert.equal(parseSubmittedCard('string'), null)
    assert.equal(parseSubmittedCard([]), null)
    assert.equal(parseSubmittedCard({}), null)
    assert.equal(parseSubmittedCard({ question: 'q' }), null) // missing fields
  })

  await test('parseSubmittedCard rejects junk signature, oversize, and bad status', async () => {
    const card = await makeSignedCard()
    const base = JSON.parse(JSON.stringify(card)) as Record<string, unknown>

    assert.equal(parseSubmittedCard({ ...base, signature: 'has spaces!' }), null)
    assert.equal(parseSubmittedCard({ ...base, signature: '' }), null)
    assert.equal(parseSubmittedCard({ ...base, status: 'totally-made-up' }), null)
    assert.equal(parseSubmittedCard({ ...base, question: 'x'.repeat(1001) }), null)
    assert.equal(parseSubmittedCard({ ...base, explanation: 'x'.repeat(20_001) }), null)
    const oneToolCall = (base.tool_calls as unknown[])[0]
    assert.equal(parseSubmittedCard({ ...base, tool_calls: new Array(33).fill(oneToolCall) }), null)
  })

  await test('F1: an injected own __proto__ key now breaks the signature (null-proto canonicalizer)', async () => {
    const card = await makeSignedCard()
    const realValue = card.tool_calls[0].result.value
    const withProto = { ...realValue } as Record<string, unknown>
    // defineProperty bypasses the prototype setter → real OWN enumerable key
    Object.defineProperty(withProto, '__proto__', {
      value: { fake: 99 },
      enumerable: true,
      configurable: true,
      writable: true,
    })
    const payload = toSignablePayload(card)
    payload.tool_calls[0].result.value = withProto
    const ok = await verifyCardSignature(payload, card.signature)
    assert.equal(ok, false, '__proto__ must be serialized into the canonical and fail verification')
  })

  await test('parseSubmittedCard rejects prototype-poisoning keys in input/value', async () => {
    const card = await makeSignedCard()
    const base = JSON.parse(JSON.stringify(card))

    const evilValue = JSON.parse(JSON.stringify(base))
    evilValue.tool_calls[0].result.value = JSON.parse('{"pH":1,"__proto__":{"x":1}}')
    assert.equal(parseSubmittedCard(evilValue), null, '__proto__ in result.value must be rejected')

    const evilInput = JSON.parse(JSON.stringify(base))
    evilInput.tool_calls[0].input = JSON.parse('{"constructor":{"x":1}}')
    assert.equal(parseSubmittedCard(evilInput), null, 'constructor in input must be rejected')
  })

  await test('parseSubmittedCard rejects over-deep / over-long values', () => {
    const stub = {
      question: 'q',
      status: 'verified',
      tool_calls: [
        { name: 'n', engine: 'e', input: {}, result: { ok: true, value: {} }, citation: 'c' },
      ],
      explanation: 'x',
      audit: { clean: true, unmatched: [] },
      model: 'm',
      version: 'v',
      issued_at: '2026-01-01T00:00:00.000Z',
      signature: 'abc',
    }

    let deep: Record<string, unknown> = { v: 1 }
    for (let i = 0; i < 10; i++) deep = { n: deep }
    const tooDeep = JSON.parse(JSON.stringify(stub))
    tooDeep.tool_calls[0].result.value = deep
    assert.equal(parseSubmittedCard(tooDeep), null, 'over-deep value must be rejected')

    const tooLong = JSON.parse(JSON.stringify(stub))
    tooLong.tool_calls[0].result.value = { s: 'x'.repeat(4001) }
    assert.equal(parseSubmittedCard(tooLong), null, 'over-long string in value must be rejected')
  })

  await test('F7: isValidSignablePayload deep-validates (rejects malformed tool_calls)', async () => {
    const card = await makeSignedCard()
    const good = toSignablePayload(card)
    assert.equal(isValidSignablePayload(good), true, 'a real signed payload must pass')
    assert.equal(isValidSignablePayload({ ...good, tool_calls: [null] }), false, 'tool_calls:[null]')
    assert.equal(isValidSignablePayload({ ...good, tool_calls: [{ name: 'n' }] }), false, 'incomplete tool_call')
    assert.equal(isValidSignablePayload({ ...good, status: 'weird' }), false, 'non-enum status')
    assert.equal(isValidSignablePayload({ ...good, audit: { clean: 'no', unmatched: [] } }), false, 'bad audit')
    assert.equal(isValidSignablePayload(null), false)
    assert.equal(isValidSignablePayload({}), false)
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

run()
