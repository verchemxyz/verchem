/** Behavioral golden contract for the unversioned public API. */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest } from 'next/server'

import { GET as getIndex } from '@/app/api/chemistry/route'
import { GET as getElements } from '@/app/api/chemistry/elements/route'
import { GET as getCompounds } from '@/app/api/chemistry/compounds/route'
import { GET as getConvert, OPTIONS as optionsConvert } from '@/app/api/chemistry/convert/route'
import { GET as getMolarMass } from '@/app/api/chemistry/molar-mass/route'
import { GET as getPH } from '@/app/api/chemistry/ph/route'
import { GET as getV2Index } from '@/app/api/chemistry/v2/route'
import { GET as getV2Elements } from '@/app/api/chemistry/v2/elements/route'
import { GET as getV2Compounds } from '@/app/api/chemistry/v2/compounds/route'
import { GET as getV2Convert } from '@/app/api/chemistry/v2/convert/route'
import { GET as getV2MolarMass } from '@/app/api/chemistry/v2/molar-mass/route'
import { GET as getV2PH } from '@/app/api/chemistry/v2/ph/route'
import {
  capturePublicApiV1Fixtures,
  frameworkMethodNotAllowed,
  snapshot,
  type PublicApiV1Handlers,
  type ResponseSnapshot,
} from '@/__tests__/support/public-api-v1-golden'
import {
  PUBLIC_API_MIGRATION_PATH,
  PUBLIC_API_VERSION,
  applyPublicApiVersionHeaders,
  publicApiJson,
} from '@/lib/api/public-contract'
import { PUBLIC_API_LIMIT } from '@/lib/api/public-rate-limit'
import { formatLegacyCompound } from '@/lib/api/chemistry/v1/compounds'
import { LEGACY_COMMON_COMPOUNDS } from '@/lib/data/compounds'
import { proxy } from '@/proxy'

interface GoldenFile {
  baseline: string
  fixedTime: string
  fixtures: Record<string, ResponseSnapshot>
}

type AllowedCompoundField = 'molecularMass' | 'hazards' | 'casNumber' | 'formula' | 'name'

interface AllowedCompoundFieldChange {
  baseline: unknown
  current: unknown
}

interface CompoundDiffAllowlist {
  baseline: string
  baselineCompoundSha256: string
  changes: Array<{
    index: number
    id: string
    fields: Partial<Record<AllowedCompoundField, AllowedCompoundFieldChange>>
  }>
}

const golden = JSON.parse(
  readFileSync(resolve(process.cwd(), '__tests__/fixtures/public-api-v1-22dbdfa.json'), 'utf8')
) as GoldenFile
const compoundDiffAllowlist = JSON.parse(
  readFileSync(
    resolve(process.cwd(), '__tests__/fixtures/public-api-v1-compound-diff-allowlist.json'),
    'utf8'
  )
) as CompoundDiffAllowlist

const NativeDate = Date
class FrozenDate extends NativeDate {
  constructor(value?: string | number | Date) {
    if (value === undefined) super(golden.fixedTime)
    else super(value)
  }

  static now(): number {
    return NativeDate.parse(golden.fixedTime)
  }
}

function request(path: string, method = 'GET'): NextRequest {
  return new NextRequest(`https://verchem.xyz${path}`, {
    method,
    headers: {
      'user-agent': 'verchem-public-api-golden',
      'x-real-ip': '203.0.113.77',
    },
  })
}

function verifyCompoundDiffAllowlist(): void {
  assert.equal(compoundDiffAllowlist.baseline, golden.baseline)

  const current = LEGACY_COMMON_COMPOUNDS.map(formatLegacyCompound)
  const reverted = structuredClone(current)
  const fieldCounts: Record<AllowedCompoundField, number> = {
    molecularMass: 0,
    hazards: 0,
    casNumber: 0,
    formula: 0,
    name: 0,
  }
  let zeroToNull = 0
  let zeroToPositiveMass = 0

  for (const allowed of compoundDiffAllowlist.changes) {
    const row = reverted[allowed.index]
    assert.ok(row, `allowlist index ${allowed.index} is outside the v1 compound array`)
    assert.equal(row.id, allowed.id, `allowlist position ${allowed.index} moved to another compound`)
    const mutableRow = row as unknown as Record<AllowedCompoundField, unknown>

    for (const [field, change] of Object.entries(allowed.fields) as Array<
      [AllowedCompoundField, AllowedCompoundFieldChange]
    >) {
      assert.deepEqual(
        mutableRow[field],
        change.current,
        `${allowed.index}:${allowed.id}.${field} no longer matches its reviewed current value`
      )
      mutableRow[field] = structuredClone(change.baseline)
      fieldCounts[field] += 1

      if (field === 'molecularMass' && change.baseline === 0) {
        if (change.current === null) zeroToNull += 1
        if (typeof change.current === 'number' && change.current > 0) {
          zeroToPositiveMass += 1
        }
      }
    }
  }

  const revertedHash = createHash('sha256')
    .update(JSON.stringify(reverted))
    .digest('hex')
  assert.equal(
    revertedHash,
    compoundDiffAllowlist.baselineCompoundSha256,
    'v1 compounds differ from 22dbdfa outside the executable allowlist'
  )

  // These numbers are derived from the reviewed entries above. They are also
  // the source of truth for release notes; no manual breakdown is accepted.
  assert.equal(compoundDiffAllowlist.changes.length, 136)
  assert.deepEqual(fieldCounts, {
    molecularMass: 107,
    hazards: 19,
    casNumber: 14,
    formula: 3,
    name: 2,
  })
  assert.equal(zeroToNull, 88)
  assert.equal(zeroToPositiveMass, 4)
}

function recordValue(value: unknown, label: string): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
  return value as Record<string, unknown>
}

/** Revert only pre-reviewed scientific corrections before baseline comparison. */
function normalizeReviewedDefaultCompoundChanges(
  fixtures: Record<string, ResponseSnapshot>
): Record<string, ResponseSnapshot> {
  const normalized = structuredClone(fixtures)
  const fixture = normalized.compoundsDefaultLimit
  assert.ok(fixture, 'missing no-limit compounds fixture')
  const body = recordValue(fixture.body, 'compoundsDefaultLimit.body')
  const compounds = body.compounds
  assert.ok(Array.isArray(compounds), 'compoundsDefaultLimit.body.compounds must be an array')

  for (const allowed of compoundDiffAllowlist.changes) {
    if (allowed.index >= compounds.length) continue
    const row = recordValue(compounds[allowed.index], `compound ${allowed.index}`)
    assert.equal(row.id, allowed.id, `default-list position ${allowed.index} moved`)

    for (const [field, change] of Object.entries(allowed.fields) as Array<
      [AllowedCompoundField, AllowedCompoundFieldChange]
    >) {
      assert.deepEqual(
        row[field],
        change.current,
        `${allowed.index}:${allowed.id}.${field} diverged from its reviewed correction`
      )
      row[field] = structuredClone(change.baseline)
    }
  }

  return normalized
}

function verifyDefaultLimitFixtures(fixtures: Record<string, ResponseSnapshot>): void {
  const elementsFixture = fixtures.elementsDefaultLimit
  assert.ok(elementsFixture, 'missing no-limit elements fixture')
  const elementsBody = recordValue(elementsFixture.body, 'elementsDefaultLimit.body')
  assert.equal(elementsBody.count, 118)
  assert.ok(Array.isArray(elementsBody.elements))
  assert.equal(elementsBody.elements.length, 118)

  const compoundsFixture = fixtures.compoundsDefaultLimit
  assert.ok(compoundsFixture, 'missing no-limit compounds fixture')
  const compoundsBody = recordValue(compoundsFixture.body, 'compoundsDefaultLimit.body')
  assert.equal(compoundsBody.count, 50)
  assert.ok(Array.isArray(compoundsBody.compounds))
  assert.equal(compoundsBody.compounds.length, 50)
  const filters = recordValue(compoundsBody.filters, 'compoundsDefaultLimit.body.filters')
  assert.equal(filters.limit, 50)
}

type PipelineHandler = (request: NextRequest) => Promise<Response>

async function throughActualProxy(requestValue: NextRequest, handler: PipelineHandler): Promise<Response> {
  const proxyResponse = await proxy(requestValue)
  if (proxyResponse.headers.get('x-middleware-next') !== '1') return proxyResponse

  const routeResponse = await handler(requestValue)
  const headers = new Headers(routeResponse.headers)
  for (const [name, value] of proxyResponse.headers) {
    if (name !== 'x-middleware-next') headers.set(name, value)
  }
  return new Response(routeResponse.body, {
    status: routeResponse.status,
    statusText: routeResponse.statusText,
    headers,
  })
}

async function verifyGoldenProxyPipeline(): Promise<void> {
  const cases: Array<{
    fixtureName: string
    method: string
    path: string
    handler: PipelineHandler
    normalize?: (fixture: ResponseSnapshot) => ResponseSnapshot
  }> = [
    {
      fixtureName: 'convertOptions',
      method: 'OPTIONS',
      path: '/api/chemistry/convert',
      handler: async () => optionsConvert(),
    },
    {
      fixtureName: 'indexMethodNotAllowed',
      method: 'POST',
      path: '/api/chemistry',
      handler: (requestValue) => frameworkMethodNotAllowed(getIndex, requestValue),
    },
    {
      fixtureName: 'elementsDefaultLimit',
      method: 'GET',
      path: '/api/chemistry/elements',
      handler: getElements,
    },
    {
      fixtureName: 'compoundsDefaultLimit',
      method: 'GET',
      path: '/api/chemistry/compounds',
      handler: getCompounds,
      normalize: (fixture) => {
        const normalized = normalizeReviewedDefaultCompoundChanges({
          compoundsDefaultLimit: fixture,
        })
        return normalized.compoundsDefaultLimit!
      },
    },
  ]

  for (const testCase of cases) {
    const response = await throughActualProxy(
      request(testCase.path, testCase.method),
      testCase.handler
    )
    const actual = await snapshot(response)
    assert.deepEqual(
      testCase.normalize ? testCase.normalize(actual) : actual,
      golden.fixtures[testCase.fixtureName],
      `${testCase.method} ${testCase.path} changed through the actual proxy pipeline`
    )
  }
}

async function verifyRateLimitPipeline(): Promise<void> {
  const v2Calls: Array<[string, PipelineHandler]> = [
    ['/api/chemistry/v2', getV2Index],
    ['/api/chemistry/v2/elements?symbol=Na', getV2Elements],
    ['/api/chemistry/v2/compounds?id=water', getV2Compounds],
    ['/api/chemistry/v2/convert?value=1&from=C&to=F&category=temperature', getV2Convert],
    ['/api/chemistry/v2/molar-mass?formula=H2O', getV2MolarMass],
    ['/api/chemistry/v2/ph?ph=7', getV2PH],
  ]

  // Cross endpoint boundaries through the actual proxy + route handlers. This
  // catches both a proxy-level limiter and the shared v2 endpoint limiter.
  for (let index = 0; index < PUBLIC_API_LIMIT.maxRequests; index += 1) {
    const [path, handler] = v2Calls[index % v2Calls.length]!
    const response = await throughActualProxy(request(path), handler)
    assert.notEqual(response.status, 429, `v2 request ${index + 1} was limited early`)
  }
  const [limitedPath, limitedHandler] = v2Calls[1]!
  const limited = await throughActualProxy(request(limitedPath), limitedHandler)
  assert.equal(limited.status, 429, 'shared v2 limiter was not exercised through the request pipeline')

  // The same saturated client must still reach every unversioned endpoint. Run
  // each route beyond the anonymous 100-request quota advertised by the legacy
  // index: cycling only 75 total calls can miss both per-endpoint and proxy caps.
  const v1Calls: Array<[string, PipelineHandler, string]> = [
    ['/api/chemistry', async () => getIndex(), 'index'],
    ['/api/chemistry/elements?symbol=Na', getElements, 'elementSodium'],
    ['/api/chemistry/compounds?id=water', getCompounds, 'compoundWater'],
    [
      '/api/chemistry/convert?value=100&from=C&to=F&category=temperature',
      getConvert,
      'convertTemperature',
    ],
    ['/api/chemistry/molar-mass?formula=H2O', getMolarMass, 'molarMassWater'],
    ['/api/chemistry/ph?ph=7', getPH, 'phFromPH'],
  ]
  for (const [path, handler, fixtureName] of v1Calls) {
    for (let requestNumber = 1; requestNumber <= 101; requestNumber += 1) {
      const response = await throughActualProxy(request(path), handler)
      assert.notEqual(
        response.status,
        429,
        `${path} leaked into a limiter on request ${requestNumber}`
      )
      if (requestNumber === 1) {
        assert.deepEqual(
          await snapshot(response),
          golden.fixtures[fixtureName],
          `${path} changed status, headers, or body through the actual proxy`
        )
      }
    }
  }
}

async function run(): Promise<void> {
  assert.equal(golden.baseline, '22dbdfa1ed7f5505cdceb32bbbd2787189b7d10f')
  globalThis.Date = FrozenDate as DateConstructor

  try {
    const handlers: PublicApiV1Handlers = {
      getIndex,
      getElements,
      getCompounds,
      getConvert,
      optionsConvert,
      getMolarMass,
      getPH,
    }
    const actual = await capturePublicApiV1Fixtures(handlers)

    verifyDefaultLimitFixtures(actual)
    assert.deepEqual(normalizeReviewedDefaultCompoundChanges(actual), golden.fixtures)
    assert.equal(Object.keys(actual).length, 42)
    assert.deepEqual(
      new Set(Object.values(actual).map((fixture: ResponseSnapshot) => fixture.status)),
      new Set([200, 400, 404, 405, 500])
    )
    verifyCompoundDiffAllowlist()
    await verifyGoldenProxyPipeline()
    await verifyRateLimitPipeline()
  } finally {
    globalThis.Date = NativeDate
  }

  // v2 stays explicitly versioned and is tested through its response helper.
  assert.equal(PUBLIC_API_VERSION, '2.0.0')
  assert.equal(PUBLIC_API_MIGRATION_PATH, '/api/chemistry/v2')
  const success = publicApiJson({ success: true })
  assert.equal(success.headers.get('X-API-Version'), PUBLIC_API_VERSION)
  assert.equal(success.headers.get('X-API-Migration'), PUBLIC_API_MIGRATION_PATH)
  assert.deepEqual(await success.json(), { apiVersion: PUBLIC_API_VERSION, success: true })

  const frameworkHeaders = new Headers()
  applyPublicApiVersionHeaders(frameworkHeaders)
  assert.equal(frameworkHeaders.get('X-API-Version'), PUBLIC_API_VERSION)
  assert.equal(frameworkHeaders.get('X-API-Migration'), PUBLIC_API_MIGRATION_PATH)

  const error = publicApiJson(
    { error: 'Rate limit exceeded' },
    { status: 429, headers: { 'Retry-After': '60' } }
  )
  assert.equal(error.status, 429)
  assert.equal(error.headers.get('Retry-After'), '60')
  assert.equal((await error.json()).apiVersion, PUBLIC_API_VERSION)

  console.log('Public API v1 branch golden + executable compound allowlist passed against 22dbdfa')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
