/** Public API v2 migration and response-version contract. */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  PUBLIC_API_MIGRATION_PATH,
  PUBLIC_API_VERSION,
  publicApiJson,
} from '@/lib/api/public-contract'

const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8')
const routePaths = [
  'app/api/chemistry/route.ts',
  'app/api/chemistry/compounds/route.ts',
  'app/api/chemistry/convert/route.ts',
  'app/api/chemistry/elements/route.ts',
  'app/api/chemistry/molar-mass/route.ts',
  'app/api/chemistry/ph/route.ts',
]

async function run(): Promise<void> {
  assert.equal(PUBLIC_API_VERSION, '2.0.0')

  for (const path of routePaths) {
    const source = read(path)
    assert.match(source, /publicApiJson/, `${path}: must use the shared versioned response helper`)
    assert.doesNotMatch(source, /NextResponse\.json/, `${path}: unversioned response bypass`)
    assert.doesNotMatch(source, /X-API-Version['"]\s*:\s*['"]/, `${path}: endpoint-local version drift`)
  }

  const success = publicApiJson({ success: true })
  assert.equal(success.headers.get('X-API-Version'), PUBLIC_API_VERSION)
  assert.equal(success.headers.get('X-API-Migration'), PUBLIC_API_MIGRATION_PATH)
  assert.deepEqual(await success.json(), { apiVersion: PUBLIC_API_VERSION, success: true })

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

  const index = read('app/api/chemistry/route.ts')
  assert.match(index, /migrationFrom: '1\.x'/)
  assert.match(index, /Compound molecularMass can be null/)
  assert.match(index, /safetyDataStatus/)
  assert.match(index, /expandedFormula/)
  assert.match(index, /HTTP 429/)

  const rateLimit = read('lib/api/public-rate-limit.ts')
  assert.match(rateLimit, /return publicApiJson/)
  assert.match(rateLimit, /status: 429/)

  const compounds = read('app/api/chemistry/compounds/route.ts')
  assert.match(compounds, /safetyDataStatus: SafetyDataStatus/)
  assert.match(compounds, /molecularMass: number \| null/)
  assert.match(compounds, /ghs: compound\.ghs \?\? \[\]/)

  const ph = read('app/api/chemistry/ph/route.ts')
  assert.match(ph, /calculatePHConversion/)
  assert.doesNotMatch(ph, /pH < 0 \|\| pH > 14|pOH < 0 \|\| pOH > 14/)

  console.log('Public API contract tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
