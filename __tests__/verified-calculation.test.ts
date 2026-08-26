import assert from 'node:assert/strict'
import { createDeterministicAnswerCard, DirectCalculationError } from '@/lib/answer-cards/deterministic-card'
import { verifyCardSignature, signCard, toSignablePayload } from '@/lib/answer-cards/signature'
import { assessEngineReplay } from '@/lib/answer-cards/replay'
import { getPublishedPublicKeys } from '@/lib/answer-cards/signing-key'
import { verifyCardJwsInBrowser } from '@/lib/answer-cards/browser-verifier'
import { isValidSignablePayload } from '@/lib/answer-cards/payload-shape'
import { simulateTitration, EXAMPLE_TITRATIONS } from '@/lib/calculations/titration'

async function expectDirectError(
  action: () => Promise<unknown>,
  code: DirectCalculationError['code']
): Promise<void> {
  try {
    await action()
    assert.fail(`Expected ${code}`)
  } catch (error: unknown) {
    assert.ok(error instanceof DirectCalculationError)
    assert.equal(error.code, code)
  }
}

async function run(): Promise<void> {
  const card = await createDeterministicAnswerCard(
    'calculate_molecular_mass',
    { formula: 'H2SO4' },
    '2026-08-20T00:00:00.000Z'
  )
  assert.equal(card.status, 'verified')
  assert.equal(card.model, 'verchem-deterministic')
  assert.equal(card.version, 'w3-v4')
  assert.equal(card.tool_calls.length, 1)
  assert.equal(card.tool_calls[0]?.result.value.molar_mass, 98.072)
  assert.equal(card.provenance?.computation, 'deterministic')
  assert.match(card.provenance?.artifact_hash ?? '', /^sha256:[a-f0-9]{64}$/)
  assert.match(card.provenance?.release_manifest_hash ?? '', /^sha256:[a-f0-9]{64}$/)
  assert.equal(await verifyCardSignature(toSignablePayload(card), card.signature), true)
  assert.equal(assessEngineReplay(card.tool_calls).status, 'current')
  assert.equal(isValidSignablePayload(toSignablePayload(card)), true)

  const publishedKeys = getPublishedPublicKeys()
  const browserResult = await verifyCardJwsInBrowser(card.signature, { keys: publishedKeys })
  assert.equal(browserResult.signatureAuthentic, true)
  assert.equal(browserResult.artifactHashMatches, true)
  assert.equal(browserResult.payload?.tool_calls[0]?.result.value.molar_mass, 98.072)

  const pendingKeyResult = await verifyCardJwsInBrowser(card.signature, {
    keys: publishedKeys.map((key) => ({ ...key, status: 'pending' })),
  })
  assert.equal(pendingKeyResult.signatureAuthentic, false)
  assert.match(pendingKeyResult.error ?? '', /not authorized to issue/)

  const duplicateKeyResult = await verifyCardJwsInBrowser(card.signature, {
    keys: [publishedKeys[0], publishedKeys[0]],
  })
  assert.equal(duplicateKeyResult.signatureAuthentic, false)
  assert.match(duplicateKeyResult.error ?? '', /key set is malformed/)

  await expectDirectError(
    () => createDeterministicAnswerCard('not_a_tool', {}, '2026-08-20T00:00:00.000Z'),
    'unknown_tool'
  )
  await expectDirectError(
    () => createDeterministicAnswerCard(
      'calculate_molecular_mass',
      { formula: 'H2O', ignored: 123 },
      '2026-08-20T00:00:00.000Z'
    ),
    'invalid_input'
  )
  await expectDirectError(
    () => createDeterministicAnswerCard('calculate_molecular_mass', {}, '2026-08-20T00:00:00.000Z'),
    'invalid_input'
  )
  await expectDirectError(
    () => createDeterministicAnswerCard(
      'calculate_molecular_mass',
      { formula: 'NotAFormula' },
      '2026-08-20T00:00:00.000Z'
    ),
    'calculation_failed'
  )

  const missingProvenance = { ...toSignablePayload(card) }
  delete missingProvenance.provenance
  assert.equal(isValidSignablePayload(missingProvenance), false)

  const wrongHashPayload = structuredClone(toSignablePayload(card))
  assert.ok(wrongHashPayload.provenance)
  wrongHashPayload.provenance.artifact_hash = `sha256:${'0'.repeat(64)}`
  const wrongHashSignature = await signCard(wrongHashPayload)
  const wrongHashResult = await verifyCardJwsInBrowser(wrongHashSignature, {
    keys: publishedKeys,
  })
  assert.equal(wrongHashResult.signatureAuthentic, true)
  assert.equal(wrongHashResult.artifactHashMatches, false)

  const validTitration = simulateTitration(
    EXAMPLE_TITRATIONS[0].acid,
    EXAMPLE_TITRATIONS[0].base,
    EXAMPLE_TITRATIONS[0].indicator,
    0.1
  )
  assert.ok(validTitration.points.length > 1)
  assert.throws(
    () => simulateTitration(
      { ...EXAMPLE_TITRATIONS[0].acid, concentration: 0 },
      EXAMPLE_TITRATIONS[0].base,
      EXAMPLE_TITRATIONS[0].indicator,
      0.1
    ),
    /positive finite number/
  )
  assert.throws(
    () => simulateTitration(
      EXAMPLE_TITRATIONS[0].acid,
      { ...EXAMPLE_TITRATIONS[0].base, type: 'weak' },
      EXAMPLE_TITRATIONS[0].indicator,
      0.1
    ),
    /strong-base titrants only/
  )

  console.log('Verified deterministic calculation and titration validation tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
