/** Public API v1 compatibility lane and explicit v2 contract. */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  PUBLIC_API_MIGRATION_PATH,
  PUBLIC_API_VERSION,
  applyPublicApiVersionHeaders,
  publicApiJson,
} from '@/lib/api/public-contract'

const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8')
const endpoints = ['index', 'compounds', 'convert', 'elements', 'molar-mass', 'ph'] as const
const v1Path = (endpoint: (typeof endpoints)[number]): string =>
  endpoint === 'index' ? 'app/api/chemistry/route.ts' : `app/api/chemistry/${endpoint}/route.ts`
const v2HandlerPath = (endpoint: (typeof endpoints)[number]): string =>
  `lib/api/chemistry/v2/${endpoint}.ts`
const v2WrapperPath = (endpoint: (typeof endpoints)[number]): string =>
  endpoint === 'index' ? 'app/api/chemistry/v2/route.ts' : `app/api/chemistry/v2/${endpoint}/route.ts`

async function run(): Promise<void> {
  assert.equal(PUBLIC_API_VERSION, '2.0.0')
  assert.equal(PUBLIC_API_MIGRATION_PATH, '/api/chemistry/v2')

  for (const endpoint of endpoints) {
    const legacy = read(v1Path(endpoint))
    assert.match(legacy, /NextResponse\.json/, `${endpoint}: unversioned route must retain v1 JSON`)
    assert.doesNotMatch(legacy, /publicApiJson/, `${endpoint}: v2 envelope leaked into v1`)

    const v2 = read(v2HandlerPath(endpoint))
    assert.match(v2, /publicApiJson/, `${endpoint}: v2 must use the versioned response helper`)
    assert.match(v2, /publicApiV2RateLimit/, `${endpoint}: v2 429 must use the v2 envelope`)
    assert.doesNotMatch(v2, /NextResponse\.json/, `${endpoint}: versioned response bypass`)

    const wrapper = read(v2WrapperPath(endpoint))
    assert.match(wrapper, new RegExp(`@/lib/api/chemistry/v2/${endpoint}`))
  }

  const success = publicApiJson({ success: true })
  assert.equal(success.headers.get('X-API-Version'), PUBLIC_API_VERSION)
  assert.equal(success.headers.get('X-API-Migration'), PUBLIC_API_MIGRATION_PATH)
  assert.deepEqual(await success.json(), { apiVersion: PUBLIC_API_VERSION, success: true })

  const frameworkHeaders = new Headers()
  applyPublicApiVersionHeaders(frameworkHeaders)
  assert.equal(frameworkHeaders.get('X-API-Version'), PUBLIC_API_VERSION)
  assert.equal(frameworkHeaders.get('X-API-Migration'), PUBLIC_API_MIGRATION_PATH)

  const attemptedOverride = publicApiJson({ apiVersion: '1.0.0' })
  assert.equal((await attemptedOverride.json()).apiVersion, PUBLIC_API_VERSION)

  const error = publicApiJson(
    { error: 'Rate limit exceeded' },
    { status: 429, headers: { 'Retry-After': '60' } }
  )
  assert.equal(error.status, 429)
  assert.equal(error.headers.get('X-API-Version'), PUBLIC_API_VERSION)
  assert.equal(error.headers.get('Retry-After'), '60')
  assert.equal((await error.json()).apiVersion, PUBLIC_API_VERSION)

  const legacyIndex = read(v1Path('index'))
  assert.match(legacyIndex, /version: '1\.0\.0'/)
  assert.doesNotMatch(legacyIndex, /migrationFrom|breakingChanges/)

  const index = read(v2HandlerPath('index'))
  assert.match(index, /migrationFrom: '1\.x'/)
  assert.match(index, /Unversioned \/api\/chemistry\/\* paths retain the v1 contract/)
  assert.match(index, /pH endpoint requires exactly one of h, oh, ph, or poh/)
  assert.match(index, /framework 404, 405, and 500 responses/)
  assert.match(index, /Compound molecularMass can be null/)
  assert.match(index, /safetyDataStatus/)
  assert.match(index, /expandedFormula/)
  assert.match(index, /HTTP 429/)

  const rateLimit = read('lib/api/public-rate-limit.ts')
  assert.match(rateLimit, /export function publicApiRateLimit[\s\S]*?return NextResponse\.json/)
  assert.match(rateLimit, /export function publicApiV2RateLimit[\s\S]*?return publicApiJson/)

  const proxy = read('proxy.ts')
  assert.match(proxy, /pathname === '\/api\/chemistry\/v2'/)
  assert.match(proxy, /applyPublicApiVersionHeaders\(response\.headers\)/)

  const compounds = read(v2HandlerPath('compounds'))
  assert.match(compounds, /safetyDataStatus: SafetyDataStatus/)
  assert.match(compounds, /molecularMass: number \| null/)
  assert.match(compounds, /ghs: compound\.ghs \?\? \[\]/)

  const legacyPH = read(v1Path('ph'))
  assert.match(legacyPH, /if \(hParam\)[\s\S]*?else if \(ohParam\)[\s\S]*?else if \(phParam\)/)
  assert.doesNotMatch(legacyPH, /Ambiguous input|suppliedInputs\.length > 1/)

  const ph = read(v2HandlerPath('ph'))
  assert.match(ph, /suppliedInputs\.length > 1/)
  assert.match(ph, /provide exactly one of: h, oh, ph, poh/)
  assert.match(ph, /calculatePHConversion/)
  assert.doesNotMatch(ph, /pH < 0 \|\| pH > 14|pOH < 0 \|\| pOH > 14/)

  console.log('Public API contract tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
