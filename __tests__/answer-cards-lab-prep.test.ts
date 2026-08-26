/** Verified Answer Card coverage for the Lab-QC as-prepared adapter. */

import assert from 'node:assert/strict'
import { createDeterministicAnswerCard } from '@/lib/answer-cards/deterministic-card'
import { verifyCardSignature, toSignablePayload } from '@/lib/answer-cards/signature'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

const tests: TestCase[] = []

function describe(_name: string, fn: () => void): void {
  fn()
}

function test(name: string, fn: TestFn): void {
  tests.push({ name, fn })
}

// QUAM:2012 A1 inputs copied from the binding uncertainty-source record.
const CARD_INPUT: Record<string, unknown> = {
  target: {
    target_conc: 1000,
    target_volume: 0.1,
    unit: 'mg/L',
    reagent_purity_percent: 99.99,
    reagent_purity_basis: 'mass',
    reagent_form: 'Cd metal',
    solvent: 'water',
    preparation_temperature_C: 20,
  },
  target_volume_unit: 'L',
  acceptance_relative_percent: 0.5,
  actual: {
    weighed_g: 0.10028,
    measured_ml: null,
    final_volume_ml: 100,
    coa_assay_percent: 99.99,
    coa_basis: 'mass',
    temperature_C: 20,
    equipment: {
      mass_standard_g: 0.00005,
      flask_tolerance_ml: 0.1,
      flask_calibration_temperature_C: 20,
      fill_repeatability_sd_ml: 0.02,
      temperature_half_width_C: 4,
      volume_expansion_coefficient_per_C: null,
      assay_tolerance_half_width_percent: 0.01,
    },
  },
}

describe('calculate_as_prepared registered adapter', () => {
  test('executes via the registry with a JSON-safe result and signed model scope', () => {
    const tool = TOOL_BY_NAME.get('calculate_as_prepared')
    assert.ok(tool)
    assert.equal(tool.engine, 'as-prepared')
    assert.equal(tool.engineVersion, '1.1.0')

    const result = tool.execute(CARD_INPUT)
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.doesNotThrow(() => JSON.stringify(result.value))
    assert.ok(Array.isArray(result.value.assumptions))
    assert.ok(Array.isArray(result.value.applicability))
    assert.ok((result.value.assumptions as unknown[]).length > 0)
    assert.ok((result.value.applicability as unknown[]).length > 0)
    assert.ok(Math.abs((result.value.asPrepared as { value: number }).value - 1002.69972) <= 1e-9)
  })

  test('rejects unsupported nested input instead of signing an ignored field', () => {
    const input = structuredClone(CARD_INPUT)
    const target = input.target as Record<string, unknown>
    target.ignored = true
    const result = TOOL_BY_NAME.get('calculate_as_prepared')!.execute(input)
    assert.equal(result.ok, false)
    assert.match(result.error ?? '', /unsupported field/i)
  })

  test('creates an independently signable deterministic Answer Card', async () => {
    const card = await createDeterministicAnswerCard(
      'calculate_as_prepared',
      CARD_INPUT,
      '2026-08-26T00:00:00.000Z'
    )
    assert.equal(card.status, 'verified')
    assert.equal(card.tool_calls.length, 1)
    assert.equal(card.tool_calls[0]?.engine, 'as-prepared')
    assert.equal(card.tool_calls[0]?.engine_version, '1.1.0')
    assert.equal(card.tool_calls[0]?.result.ok, true)
    assert.equal(await verifyCardSignature(toSignablePayload(card), card.signature), true)
  })
})

async function runTests(): Promise<void> {
  console.log('🧪 Lab-QC Answer Card adapter tests\n')
  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log('  ✓ ' + testCase.name)
    } catch (error) {
      failures.push(testCase.name)
      console.log('  ✗ ' + testCase.name)
      console.error(error)
    }
  }

  console.log(`\n${passed} passed, ${failures.length} failed`)
  if (failures.length > 0) process.exitCode = 1
}

void runTests()
