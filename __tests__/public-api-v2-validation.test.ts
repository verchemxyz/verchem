/** R9 regressions for strict v2 element and molar-mass input contracts. */

import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

import { GET as getV2Elements } from '@/app/api/chemistry/v2/elements/route'
import { GET as getV2MolarMass } from '@/app/api/chemistry/v2/molar-mass/route'

function request(path: string): NextRequest {
  return new NextRequest(`https://verchem.xyz${path}`, {
    headers: {
      'user-agent': 'verchem-v2-r9-regression',
      'x-real-ip': '203.0.113.91',
    },
  })
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
  return value as Record<string, unknown>
}

async function run(): Promise<void> {
  for (const value of ['11junk', '11.9', '11e0', '+11', ' 11', '', '0', '119']) {
    const response = await getV2Elements(request(`/api/chemistry/v2/elements?number=${encodeURIComponent(value)}`))
    assert.equal(response.status, 400, `number=${JSON.stringify(value)} must be rejected`)
    const body = asRecord(await response.json(), 'elements error body')
    assert.match(String(body.hint), /whole-number string from 1 to 118/i)
  }

  const sodiumResponse = await getV2Elements(request('/api/chemistry/v2/elements?number=11'))
  assert.equal(sodiumResponse.status, 200)
  const sodiumBody = asRecord(await sodiumResponse.json(), 'sodium body')
  const sodium = asRecord(sodiumBody.element, 'sodium element')
  assert.equal(sodium.atomicNumber, 11)
  assert.equal(sodium.symbol, 'Na')

  for (const formula of [
    'H9007199254740993',
    'H1000001',
    '(H600000)2',
  ]) {
    const response = await getV2MolarMass(
      request(`/api/chemistry/v2/molar-mass?formula=${encodeURIComponent(formula)}`)
    )
    assert.equal(response.status, 400, `${formula} must reject an unsafe/out-of-range count`)
    const body = asRecord(await response.json(), 'molar-mass error body')
    assert.match(String(body.error), /subscript out of range/i)
  }

  const aceticResponse = await getV2MolarMass(
    request('/api/chemistry/v2/molar-mass?formula=CH3COOH')
  )
  assert.equal(aceticResponse.status, 200)
  const aceticBody = asRecord(await aceticResponse.json(), 'acetic-acid body')
  assert.ok(Array.isArray(aceticBody.composition))
  const composition = aceticBody.composition.map((row, index) =>
    asRecord(row, `composition row ${index}`)
  )
  assert.equal(composition.length, 3, 'CH3COOH must have one aggregate row per element')
  assert.deepEqual(
    composition.map((row) => [row.element, row.count]),
    [['C', 2], ['H', 4], ['O', 2]]
  )
  const percentageTotal = composition.reduce((sum, row) => {
    const percentage = asRecord(row.percentage, `${String(row.element)} percentage`)
    assert.equal(typeof percentage.value, 'number')
    return sum + (percentage.value as number)
  }, 0)
  assert.ok(Math.abs(percentageTotal - 100) < 1e-12, `composition total was ${percentageTotal}`)

  console.log('Public API v2 strict element/molar-mass regressions passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
