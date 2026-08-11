import assert from 'node:assert/strict'
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as signEd25519,
  verify as verifyEd25519,
  type JsonWebKey,
  type KeyObject,
} from 'node:crypto'

import { GET as getJwks } from '@/app/.well-known/verchem-keys.json/route'
import { classifyServiceError } from '@/lib/answer-cards/orchestrator'
import {
  canonicalPayloadString,
  isStructurallyValidCardJws,
  signCard,
  verifyCanonicalSignature,
  verifyCardSignature,
} from '@/lib/answer-cards/signature'
import {
  calculateJwkThumbprint,
  getActiveSigningKey,
  PENDING_PUBLIC_KEYS,
  SigningKeyConfigurationError,
  type PendingVerchemJwk,
} from '@/lib/answer-cards/signing-key'
import type { AnswerCard, SignablePayload } from '@/lib/answer-cards/types'
import { parseSubmittedCard } from '@/lib/answer-cards/validate-card'

type TestCase = { name: string; run: () => void | Promise<void> }

const tests: TestCase[] = []
const originalCardSigningKey = process.env.CARD_SIGNING_PRIVATE_KEY
const originalNodeEnv = process.env.NODE_ENV

const RFC_8037_PRIVATE_JWK: JsonWebKey = {
  kty: 'OKP',
  crv: 'Ed25519',
  d: 'nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A',
  x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
}
const RFC_8037_PUBLIC_JWK: JsonWebKey = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
}
const RFC_8037_KID = 'kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k'
const RFC_8037_JWS =
  'eyJhbGciOiJFZERTQSJ9.RXhhbXBsZSBvZiBFZDI1NTE5IHNpZ25pbmc.' +
  'hgyY0il_MGCjP0JzlnLWG1PPOt7-09PGcvMg3AIbQR6dWbhijcNR4ki4iylGjg5BhVsPt9g7sVvpAr_MuM0KAg'

const rfcPrivateKey = createPrivateKey({ key: RFC_8037_PRIVATE_JWK, format: 'jwk' })
const rfcPublicKey = createPublicKey({ key: RFC_8037_PUBLIC_JWK, format: 'jwk' })
const rfcPemExport = rfcPrivateKey.export({ format: 'pem', type: 'pkcs8' })
const rfcPem = typeof rfcPemExport === 'string' ? rfcPemExport : rfcPemExport.toString('utf8')
const rfcConfiguredKey = Buffer.from(rfcPem, 'utf8').toString('base64')

function test(name: string, run: TestCase['run']): void {
  tests.push({ name, run })
}

function restoreEnv(name: 'CARD_SIGNING_PRIVATE_KEY' | 'NODE_ENV', value: string | undefined): void {
  if (value === undefined) Reflect.deleteProperty(process.env, name)
  else Reflect.set(process.env, name, value)
}

function configureRfcKey(): void {
  Reflect.set(process.env, 'CARD_SIGNING_PRIVATE_KEY', rfcConfiguredKey)
  Reflect.set(process.env, 'NODE_ENV', 'test')
}

function payload(overrides: Partial<SignablePayload> = {}): SignablePayload {
  return {
    question: 'What is the pH of 0.1 M HCl?',
    status: 'verified',
    tool_calls: [
      {
        name: 'calculate_strong_acid_ph',
        engine: 'strong-acid-pH',
        engine_version: '2.0.1',
        input: { concentration: 0.1, formula: 'HCl' },
        result: { ok: true, value: { pH: 1, method: 'strong-acid' } },
        citation: 'IUPAC Gold Book',
      },
    ],
    explanation: 'The recognized strong acid dissociates completely.',
    audit: { clean: true, unmatched: [] },
    model: 'test-model',
    version: 'w3-v2',
    issued_at: '2026-08-11T00:00:00.000Z',
    ...overrides,
  }
}

function answerCard(signable: SignablePayload, signature: string): AnswerCard {
  return {
    ...signable,
    verified: signable.status === 'verified',
    signature,
  }
}

function compactJws(
  header: Record<string, unknown>,
  canonical: string,
  privateKey: KeyObject = rfcPrivateKey
): string {
  const protectedSegment = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url')
  const payloadSegment = Buffer.from(canonical, 'utf8').toString('base64url')
  const signingInput = `${protectedSegment}.${payloadSegment}`
  const signature = signEd25519(null, Buffer.from(signingInput, 'ascii'), privateKey)
    .toString('base64url')
  return `${signingInput}.${signature}`
}

function decodeHeader(signature: string): Record<string, unknown> {
  const protectedSegment = signature.split('.')[0]
  assert.ok(protectedSegment)
  const parsed: unknown = JSON.parse(Buffer.from(protectedSegment, 'base64url').toString('utf8'))
  assert.equal(typeof parsed, 'object')
  assert.ok(parsed !== null && !Array.isArray(parsed))
  return parsed as Record<string, unknown>
}

test('RFC 8037 Ed25519 signing/validation vector matches node:crypto', () => {
  const [protectedSegment, payloadSegment, signatureSegment] = RFC_8037_JWS.split('.')
  assert.ok(protectedSegment && payloadSegment && signatureSegment)
  const signingInput = `${protectedSegment}.${payloadSegment}`
  const expectedSignature = Buffer.from(signatureSegment, 'base64url')

  assert.equal(
    verifyEd25519(null, Buffer.from(signingInput, 'ascii'), rfcPublicKey, expectedSignature),
    true
  )
  assert.equal(
    signEd25519(null, Buffer.from(signingInput, 'ascii'), rfcPrivateKey).toString('base64url'),
    signatureSegment
  )
  assert.equal(
    calculateJwkThumbprint({
      kty: 'OKP',
      crv: 'Ed25519',
      x: RFC_8037_PUBLIC_JWK.x!,
    }),
    RFC_8037_KID
  )
})

test('compact JWS roundtrip preserves the exact canonical payload bytes', async () => {
  configureRfcKey()
  const signable = payload()
  const canonical = canonicalPayloadString(signable)
  const signature = await signCard(signable)
  const segments = signature.split('.')

  assert.equal(segments.length, 3)
  assert.equal(isStructurallyValidCardJws(signature), true)
  assert.deepEqual(decodeHeader(signature), {
    alg: 'EdDSA',
    kid: RFC_8037_KID,
    typ: 'verchem-card+jws',
  })
  assert.equal(Buffer.from(segments[1]!, 'base64url').toString('utf8'), canonical)
  assert.equal(await verifyCardSignature(signable, signature), true)
  assert.equal(await verifyCanonicalSignature(canonical, signature), true)
})

test('tampering every signed payload field fails verification', async () => {
  configureRfcKey()
  const original = payload()
  const signature = await signCard(original)
  const mutations: Array<{ name: string; mutate: (value: SignablePayload) => void }> = [
    { name: 'question', mutate: (value) => { value.question = 'Changed question' } },
    { name: 'status', mutate: (value) => { value.status = 'partial' } },
    { name: 'tool_calls', mutate: (value) => { value.tool_calls.push({ ...value.tool_calls[0]! }) } },
    { name: 'tool name', mutate: (value) => { value.tool_calls[0]!.name = 'changed_tool' } },
    { name: 'engine', mutate: (value) => { value.tool_calls[0]!.engine = 'changed-engine' } },
    { name: 'engine_version', mutate: (value) => { value.tool_calls[0]!.engine_version = '9.9.9' } },
    { name: 'input', mutate: (value) => { value.tool_calls[0]!.input.concentration = 0.2 } },
    { name: 'result.ok', mutate: (value) => { value.tool_calls[0]!.result.ok = false } },
    { name: 'result.value', mutate: (value) => { value.tool_calls[0]!.result.value.pH = 14 } },
    { name: 'result.error', mutate: (value) => { value.tool_calls[0]!.result.error = 'forged' } },
    { name: 'citation', mutate: (value) => { value.tool_calls[0]!.citation = 'Changed source' } },
    { name: 'explanation', mutate: (value) => { value.explanation = 'Changed explanation' } },
    { name: 'audit.clean', mutate: (value) => { value.audit.clean = false } },
    { name: 'audit.unmatched', mutate: (value) => { value.audit.unmatched.push('99') } },
    { name: 'model', mutate: (value) => { value.model = 'changed-model' } },
    { name: 'version', mutate: (value) => { value.version = 'changed-version' } },
    { name: 'issued_at', mutate: (value) => { value.issued_at = '2026-08-12T00:00:00.000Z' } },
  ]

  for (const mutation of mutations) {
    const changed = structuredClone(original)
    mutation.mutate(changed)
    assert.equal(
      await verifyCardSignature(changed, signature),
      false,
      `${mutation.name} tamper unexpectedly verified`
    )
  }
})

test('valid JWS for a different canonical payload is rejected', async () => {
  configureRfcKey()
  const expected = payload()
  const substituted = payload({ question: 'A different signed card' })
  const substitutedJws = await signCard(substituted)

  assert.equal(await verifyCardSignature(substituted, substitutedJws), true)
  assert.equal(await verifyCardSignature(expected, substitutedJws), false)
})

test('tampered header and cryptographically valid unknown kid are rejected', async () => {
  configureRfcKey()
  const signable = payload()
  const canonical = canonicalPayloadString(signable)
  const wrongAlgorithm = compactJws(
    { alg: 'HS256', kid: RFC_8037_KID, typ: 'verchem-card+jws' },
    canonical
  )
  const unknownKid = 'A'.repeat(43)
  const unknownKidJws = compactJws(
    { alg: 'EdDSA', kid: unknownKid, typ: 'verchem-card+jws' },
    canonical
  )

  assert.equal(isStructurallyValidCardJws(wrongAlgorithm), false)
  assert.equal(await verifyCardSignature(signable, wrongAlgorithm), false)
  assert.equal(isStructurallyValidCardJws(unknownKidJws), true)
  assert.equal(await verifyCardSignature(signable, unknownKidJws), false)

  const [protectedSegment, payloadSegment, signatureSegment] = unknownKidJws.split('.')
  assert.ok(protectedSegment && payloadSegment && signatureSegment)
  assert.equal(
    verifyEd25519(
      null,
      Buffer.from(`${protectedSegment}.${payloadSegment}`, 'ascii'),
      rfcPublicKey,
      Buffer.from(signatureSegment, 'base64url')
    ),
    true,
    'unknown-kid fixture must be cryptographically valid before registry rejection'
  )
})

test('malformed compact JWS is rejected before verification', async () => {
  configureRfcKey()
  const signable = payload()
  const valid = await signCard(signable)
  const [protectedSegment, payloadSegment, signatureSegment] = valid.split('.')
  assert.ok(protectedSegment && payloadSegment && signatureSegment)
  const malformed = [
    '',
    'one-segment',
    'two.segments',
    'four.segment.jws.parts',
    `*.${payloadSegment}.${signatureSegment}`,
    `${protectedSegment}.*.${signatureSegment}`,
    `${protectedSegment}.${payloadSegment}.short`,
    `${protectedSegment}.${payloadSegment}.${signatureSegment}=`,
    `${Buffer.from('{}', 'utf8').toString('base64url')}.${payloadSegment}.${signatureSegment}`,
  ]

  for (const candidate of malformed) {
    assert.equal(isStructurallyValidCardJws(candidate), false, candidate)
    assert.equal(await verifyCardSignature(signable, candidate), false, candidate)
    assert.equal(parseSubmittedCard(answerCard(signable, candidate)), null, candidate)
  }

  const badButWellFormed = `${protectedSegment}.${payloadSegment}.${Buffer.alloc(64).toString('base64url')}`
  assert.equal(isStructurallyValidCardJws(badButWellFormed), true)
  assert.ok(parseSubmittedCard(answerCard(signable, badButWellFormed)))
  assert.equal(await verifyCardSignature(signable, badButWellFormed), false)
})

test('JWKS route publishes only public active material and an independent RFC 7638 kid', async () => {
  configureRfcKey()
  const response = getJwks()
  const responseText = await response.text()
  const document: unknown = JSON.parse(responseText)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/u)
  assert.equal(
    response.headers.get('cache-control'),
    'public, max-age=3600, stale-while-revalidate=86400'
  )
  assert.ok(typeof document === 'object' && document !== null && !Array.isArray(document))
  const keys = (document as Record<string, unknown>).keys
  assert.ok(Array.isArray(keys))
  assert.equal(keys.length, 1)
  const active: unknown = keys[0]
  assert.ok(typeof active === 'object' && active !== null && !Array.isArray(active))
  const jwk = active as Record<string, unknown>
  assert.deepEqual(Object.keys(jwk).sort(), ['crv', 'kid', 'kty', 'status', 'x'])
  assert.equal(jwk.kty, 'OKP')
  assert.equal(jwk.crv, 'Ed25519')
  assert.equal(jwk.status, 'active')
  assert.equal(jwk.x, RFC_8037_PUBLIC_JWK.x)

  const independentCanonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })
  const independentKid = createHash('sha256')
    .update(independentCanonical, 'utf8')
    .digest('base64url')
  assert.equal(jwk.kid, independentKid)
  assert.equal(jwk.kid, RFC_8037_KID)
  assert.equal('d' in jwk, false)
  assert.doesNotMatch(responseText, /PRIVATE KEY|BEGIN PRIVATE|"d"\s*:/u)
  assert.equal(responseText.includes(rfcConfiguredKey), false)
})

test('pending rotation key is published and accepted for server-side verification', async () => {
  configureRfcKey()
  const { privateKey: pendingPrivateKey, publicKey: pendingPublicKey } =
    generateKeyPairSync('ed25519')
  const exported = pendingPublicKey.export({ format: 'jwk' })
  assert.equal(exported.kty, 'OKP')
  assert.equal(exported.crv, 'Ed25519')
  assert.equal(typeof exported.x, 'string')

  const pendingPublicJwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: exported.x!,
  } as const
  const pendingKid = calculateJwkThumbprint(pendingPublicJwk)
  const pendingFixture: PendingVerchemJwk = {
    ...pendingPublicJwk,
    kid: pendingKid,
    status: 'pending',
  }
  const mutablePendingKeys = PENDING_PUBLIC_KEYS as PendingVerchemJwk[]
  mutablePendingKeys.push(pendingFixture)

  try {
    const response = getJwks()
    const responseText = await response.text()
    const document: unknown = JSON.parse(responseText)
    assert.ok(typeof document === 'object' && document !== null && !Array.isArray(document))
    const keys = (document as Record<string, unknown>).keys
    assert.ok(Array.isArray(keys))
    assert.equal(keys.length, 2)

    const pending: unknown = keys.find(
      (candidate: unknown) =>
        typeof candidate === 'object' &&
        candidate !== null &&
        !Array.isArray(candidate) &&
        (candidate as Record<string, unknown>).status === 'pending'
    )
    assert.ok(typeof pending === 'object' && pending !== null && !Array.isArray(pending))
    const jwk = pending as Record<string, unknown>
    assert.deepEqual(Object.keys(jwk).sort(), ['crv', 'kid', 'kty', 'status', 'x'])
    assert.equal(jwk.kty, 'OKP')
    assert.equal(jwk.crv, 'Ed25519')
    assert.equal(jwk.x, pendingPublicJwk.x)
    assert.equal(jwk.kid, pendingKid)
    assert.equal('d' in jwk, false)

    const independentCanonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })
    const independentKid = createHash('sha256')
      .update(independentCanonical, 'utf8')
      .digest('base64url')
    assert.equal(independentKid, pendingKid)

    const signable = payload({ question: 'Card signed immediately after pending activation' })
    const pendingJws = compactJws(
      { alg: 'EdDSA', kid: pendingKid, typ: 'verchem-card+jws' },
      canonicalPayloadString(signable),
      pendingPrivateKey
    )
    assert.equal(await verifyCardSignature(signable, pendingJws), true)
  } finally {
    const fixtureIndex = mutablePendingKeys.indexOf(pendingFixture)
    if (fixtureIndex >= 0) mutablePendingKeys.splice(fixtureIndex, 1)
  }
})

test('production missing key throws on use and maps card creation to 503', () => {
  Reflect.deleteProperty(process.env, 'CARD_SIGNING_PRIVATE_KEY')
  Reflect.set(process.env, 'NODE_ENV', 'production')

  let thrown: unknown
  try {
    getActiveSigningKey()
  } catch (error: unknown) {
    thrown = error
  }
  assert.ok(thrown instanceof SigningKeyConfigurationError)
  const serviceError = classifyServiceError(thrown)
  assert.equal(serviceError.kind, 'auth')
  assert.equal(serviceError.httpStatus, 503)
  assert.doesNotMatch(serviceError.publicMessage, /key|secret|CARD_SIGNING/u)
})

test('development/test missing key generates one ephemeral key and warns once', () => {
  Reflect.deleteProperty(process.env, 'CARD_SIGNING_PRIVATE_KEY')
  Reflect.set(process.env, 'NODE_ENV', 'test')
  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (message?: unknown) => { warnings.push(String(message)) }

  try {
    const first = getActiveSigningKey()
    const second = getActiveSigningKey()
    assert.equal(first, second)
    assert.equal(first.kid, second.kid)
    assert.equal(first.publicJwk.kty, 'OKP')
    assert.equal(first.publicJwk.crv, 'Ed25519')
    assert.equal(first.privateKey.asymmetricKeyType, 'ed25519')
  } finally {
    console.warn = originalWarn
  }

  assert.equal(warnings.length, 1)
  assert.match(warnings[0]!, /ephemeral Ed25519 key/u)
  assert.doesNotMatch(warnings[0]!, /BEGIN PRIVATE|CARD_SIGNING_PRIVATE_KEY=/u)
})

async function run(): Promise<void> {
  let passed = 0
  let failed = 0

  try {
    for (const current of tests) {
      try {
        await current.run()
        passed++
        console.log('  ✓', current.name)
      } catch (error: unknown) {
        failed++
        console.error('  ✗', current.name)
        console.error('   ', error instanceof Error ? error.message : error)
      }
    }
  } finally {
    restoreEnv('CARD_SIGNING_PRIVATE_KEY', originalCardSigningKey)
    restoreEnv('NODE_ENV', originalNodeEnv)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
}

void run()
