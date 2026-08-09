/** Behavioral golden contract for the unversioned public API. */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest } from 'next/server'

import { GET as getIndex } from '@/app/api/chemistry/route'
import { GET as getElements } from '@/app/api/chemistry/elements/route'
import { GET as getCompounds } from '@/app/api/chemistry/compounds/route'
import { GET as getConvert } from '@/app/api/chemistry/convert/route'
import { GET as getMolarMass } from '@/app/api/chemistry/molar-mass/route'
import { GET as getPH } from '@/app/api/chemistry/ph/route'
import {
  PUBLIC_API_MIGRATION_PATH,
  PUBLIC_API_VERSION,
  applyPublicApiVersionHeaders,
  publicApiJson,
} from '@/lib/api/public-contract'

interface ResponseSnapshot {
  status: number
  headers: Record<string, string>
  body: unknown
}

interface GoldenFile {
  baseline: string
  fixedTime: string
  fixtures: Record<string, ResponseSnapshot>
}

const golden = JSON.parse(
  readFileSync(resolve(process.cwd(), '__tests__/fixtures/public-api-v1-22dbdfa.json'), 'utf8')
) as GoldenFile

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

function request(path: string): NextRequest {
  return new NextRequest(`https://verchem.xyz${path}`)
}

async function snapshot(response: Response): Promise<ResponseSnapshot> {
  return {
    status: response.status,
    headers: Object.fromEntries(
      [...response.headers.entries()].sort(([a], [b]) => a.localeCompare(b))
    ),
    body: await response.json() as unknown,
  }
}

async function run(): Promise<void> {
  assert.equal(golden.baseline, '22dbdfa')
  globalThis.Date = FrozenDate as DateConstructor

  try {
    const actual: Record<string, ResponseSnapshot> = {
      index: await snapshot(await getIndex()),
      elementSodium: await snapshot(await getElements(request('/api/chemistry/elements?symbol=Na'))),
      elementLegacyNumberParsing: await snapshot(await getElements(request('/api/chemistry/elements?number=1abc'))),
      compoundWater: await snapshot(await getCompounds(request('/api/chemistry/compounds?id=water'))),
      compoundLegacyMixtureMass: await snapshot(await getCompounds(request('/api/chemistry/compounds?id=petroleum-ether'))),
      compoundInvalidLimit: await snapshot(await getCompounds(request('/api/chemistry/compounds?limit=0'))),
      convertTemperature: await snapshot(await getConvert(request('/api/chemistry/convert?value=100&from=C&to=F&category=temperature'))),
      convertMissing: await snapshot(await getConvert(request('/api/chemistry/convert'))),
      molarMassWater: await snapshot(await getMolarMass(request('/api/chemistry/molar-mass?formula=H2O'))),
      molarMassParenthesesRejected: await snapshot(await getMolarMass(request('/api/chemistry/molar-mass?formula=Ca(OH)2'))),
      phLegacyModelFieldsIgnored: await snapshot(await getPH(request('/api/chemistry/ph?ph=7&temperature_c=80&activity_model=ideal'))),
      phLegacyPrecedence: await snapshot(await getPH(request('/api/chemistry/ph?h=0.001&ph=12'))),
      phMissing: await snapshot(await getPH(request('/api/chemistry/ph'))),
    }

    assert.deepEqual(actual, golden.fixtures)

    const legacyZeroSentinel = await snapshot(
      await getCompounds(request('/api/chemistry/compounds?id=npk-15-15-15'))
    )
    const zeroSentinelBody = legacyZeroSentinel.body as {
      compound?: { molecularMass?: number | null }
    }
    assert.equal(zeroSentinelBody.compound?.molecularMass, null)

    // The v1 lane at 22dbdfa had no executable limiter. Repeated real handler
    // calls must remain byte-for-byte equivalent rather than turning into 429.
    for (let requestNumber = 0; requestNumber < 75; requestNumber += 1) {
      const repeated = await snapshot(
        await getMolarMass(request('/api/chemistry/molar-mass?formula=H2O'))
      )
      assert.deepEqual(repeated, golden.fixtures.molarMassWater)
    }
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

  console.log('Public API v1 behavioral golden passed against 22dbdfa')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
