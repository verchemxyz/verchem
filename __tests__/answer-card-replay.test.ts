/** Signature integrity and current-engine agreement are independent contracts. */

import assert from 'node:assert/strict'

import { assessEngineReplay, isCurrentlyVerifiedAnswer } from '@/lib/answer-cards/replay'
import { CURRENT_ENGINE_VERSIONS } from '@/lib/answer-cards/engine-versions'
import { signCard, verifyCardSignature } from '@/lib/answer-cards/signature'
import { ALL_TOOLS, TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import type { SignablePayload, ToolCall } from '@/lib/answer-cards/types'
import { PH_MODEL_25C } from '@/lib/calculations/solutions'

function payloadFor(call: ToolCall, version = 'w3-v2'): SignablePayload {
  return {
    question: 'What is the pH of 0.1 M HCl?',
    status: 'verified',
    tool_calls: [call],
    explanation: 'Strongly acidic because the recognized strong acid dissociates.',
    audit: { clean: true, unmatched: [] },
    model: 'test-model',
    version,
    issued_at: '2026-08-10T00:00:00.000Z',
  }
}

async function run(): Promise<void> {
  const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')
  assert.ok(tool)
  const input = { concentration: 0.1, formula: 'HCl' }
  const currentResult = tool.execute(input)

  const currentCall: ToolCall = {
    name: tool.name,
    engine: tool.engine,
    engine_version: tool.engineVersion,
    input,
    result: currentResult,
    citation: tool.citation,
  }

  const currentAssessment = assessEngineReplay([currentCall])
  assert.equal(currentAssessment.status, 'current')
  assert.equal(currentAssessment.currentEngineAgrees, true)
  assert.equal(currentAssessment.allVersionsCurrent, true)
  assert.equal(isCurrentlyVerifiedAnswer('verified', true, currentAssessment), true)
  assert.equal(isCurrentlyVerifiedAnswer('partial', true, currentAssessment), false)

  const emptyAssessment = assessEngineReplay([])
  assert.equal(emptyAssessment.status, 'unavailable')
  assert.equal(emptyAssessment.currentEngineAgrees, false)

  // A genuine legacy card can keep an intact signature while being superseded.
  const legacyCall: ToolCall = { ...currentCall }
  delete legacyCall.engine_version
  const legacyPayload = payloadFor(legacyCall, 'w3-v1')
  const legacySignature = await signCard(legacyPayload)
  assert.equal(await verifyCardSignature(legacyPayload, legacySignature), true)
  const legacyAssessment = assessEngineReplay([legacyCall])
  assert.equal(legacyAssessment.status, 'superseded')
  assert.equal(legacyAssessment.currentEngineAgrees, true)
  assert.equal(legacyAssessment.allVersionsCurrent, false)
  assert.equal(isCurrentlyVerifiedAnswer('verified', true, legacyAssessment), false)

  const replacedEngineCall: ToolCall = {
    ...currentCall,
    engine: 'historical-strong-acid-engine',
    engine_version: '1.0.0',
  }
  const replacedAssessment = assessEngineReplay([replacedEngineCall])
  assert.equal(replacedAssessment.status, 'superseded')
  assert.equal(replacedAssessment.currentEngineAgrees, true)

  // A historically signed wrong result remains authentic history, not current truth.
  const correctedCall: ToolCall = {
    ...legacyCall,
    result: { ok: true, value: { ...legacyCall.result.value, pH: 99 } },
  }
  const correctedPayload = payloadFor(correctedCall, 'w3-v1')
  const correctedSignature = await signCard(correctedPayload)
  assert.equal(await verifyCardSignature(correctedPayload, correctedSignature), true)
  const correctedAssessment = assessEngineReplay([correctedCall])
  assert.equal(correctedAssessment.status, 'corrected')
  assert.equal(correctedAssessment.currentEngineAgrees, false)
  assert.equal(isCurrentlyVerifiedAnswer('verified', true, correctedAssessment), false)
  assert.equal(isCurrentlyVerifiedAnswer('verified', false, currentAssessment), false)

  // Replay catches behavior drift even if a developer forgets to bump the version.
  const missedBump = { ...correctedCall, engine_version: tool.engineVersion }
  assert.equal(assessEngineReplay([missedBump]).status, 'corrected')

  // Engine release is signed; callers cannot upgrade an old card by editing it.
  const currentPayload = payloadFor(currentCall)
  const currentSignature = await signCard(currentPayload)
  const forgedVersion = payloadFor({ ...currentCall, engine_version: '999.0.0' })
  assert.equal(await verifyCardSignature(forgedVersion, currentSignature), false)

  // R9 regression: 2.0.0 omitted Kw from weak-acid equilibrium, so a signed
  // 1e-8 M acetic-acid card claimed pH > 7. Its signature remains authentic,
  // but replay against 2.0.1 must label the scientific result corrected.
  const weakAcidTool = TOOL_BY_NAME.get('calculate_weak_acid_ph')
  assert.ok(weakAcidTool)
  assert.equal(weakAcidTool.engineVersion, '2.0.1')
  const historicalWeakAcidCall: ToolCall = {
    name: weakAcidTool.name,
    engine: weakAcidTool.engine,
    engine_version: '2.0.0',
    input: { concentration: 1e-8, Ka: 1.74e-5 },
    result: {
      ok: true,
      value: {
        pH: 8.000249379636504,
        H_concentration: 9.99425946997998e-9,
        percent_ionization: 99.9425946997998,
        method: 'quadratic',
        warning: 'Significant ionization (99.9%) - used quadratic formula for accuracy',
        Kw: 1e-14,
        model: PH_MODEL_25C,
      },
    },
    citation: weakAcidTool.citation,
  }
  const historicalWeakAcidPayload = payloadFor(historicalWeakAcidCall, 'w3-v2')
  const historicalWeakAcidSignature = await signCard(historicalWeakAcidPayload)
  assert.equal(
    await verifyCardSignature(historicalWeakAcidPayload, historicalWeakAcidSignature),
    true
  )
  const weakAcidReplay = assessEngineReplay([historicalWeakAcidCall])
  assert.equal(weakAcidReplay.status, 'corrected')
  assert.equal(weakAcidReplay.currentEngineAgrees, false)
  assert.equal(isCurrentlyVerifiedAnswer('verified', true, weakAcidReplay), false)

  const weakBaseTool = TOOL_BY_NAME.get('calculate_weak_base_ph')
  assert.ok(weakBaseTool)
  assert.equal(weakBaseTool.engineVersion, '2.0.1')

  assert.equal(ALL_TOOLS.length, 61)
  assert.equal(Object.keys(CURRENT_ENGINE_VERSIONS).length, ALL_TOOLS.length)
  assert.equal(new Set(ALL_TOOLS.map((candidate) => candidate.engine)).size, ALL_TOOLS.length)
  assert.ok(ALL_TOOLS.every((candidate) => /^\d+\.\d+\.\d+$/.test(candidate.engineVersion)))

  console.log('Answer card replay tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
