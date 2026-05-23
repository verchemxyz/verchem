/**
 * Share URL encoding/decoding tests
 */

import assert from 'node:assert/strict'
import {
  encodeShareUrl,
  parseShareParams,
  MAX_SHARED_SMILES_LEN,
} from '@/lib/molecule/share-url'

type TestFn = () => void | Promise<void>
interface TestCase { name: string; fn: TestFn }

const tests: TestCase[] = []

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function runTests() {
  let passed = 0
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      const result = fn()
      if (result instanceof Promise) {
        throw new Error('Async tests not supported in this runner')
      }
      passed++
      console.log(`  ✅ ${name}`)
    } catch (err) {
      failed++
      console.error(`  ❌ ${name}`)
      console.error('    ', (err as Error).message)
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

// --- Tests ---

test('parseShareParams accepts valid SMILES (CCO)', () => {
  const params = new URLSearchParams('smiles=CCO')
  const result = parseShareParams(params)
  assert.equal(result.smiles, 'CCO')
  assert.equal(result.molId, null)
  assert.equal(result.error, null)
})

test('parseShareParams accepts valid aromatic SMILES (c1ccccc1)', () => {
  const params = new URLSearchParams('smiles=c1ccccc1')
  const result = parseShareParams(params)
  assert.equal(result.smiles, 'c1ccccc1')
  assert.equal(result.error, null)
})

test('parseShareParams rejects empty SMILES', () => {
  const params = new URLSearchParams('smiles=')
  const result = parseShareParams(params)
  assert.equal(result.error, 'Empty SMILES parameter')
})

test('parseShareParams rejects SMILES > 2000 chars', () => {
  const longSmiles = 'C'.repeat(MAX_SHARED_SMILES_LEN + 1)
  const params = new URLSearchParams(`smiles=${longSmiles}`)
  const result = parseShareParams(params)
  assert.equal(result.error, 'SMILES too long (max 2000 chars)')
})

test('parseShareParams rejects control characters in SMILES', () => {
  const params = new URLSearchParams('smiles=CC\x00O')
  const result = parseShareParams(params)
  assert.equal(result.error, 'SMILES contains invalid characters')
})

test('parseShareParams rejects tab in SMILES', () => {
  const params = new URLSearchParams('smiles=CC\tO')
  const result = parseShareParams(params)
  assert.equal(result.error, 'SMILES contains invalid characters')
})

test('parseShareParams accepts valid UUID v4 for mol_id', () => {
  const params = new URLSearchParams('mol_id=550e8400-e29b-41d4-a716-446655440000')
  const result = parseShareParams(params)
  assert.equal(result.molId, '550e8400-e29b-41d4-a716-446655440000')
  assert.equal(result.error, null)
})

test('parseShareParams rejects malformed UUID (too short)', () => {
  const params = new URLSearchParams('mol_id=550e8400-e29b-41d4-a716')
  const result = parseShareParams(params)
  assert.equal(result.error, 'Invalid mol_id format')
})

test('parseShareParams rejects UUID without dashes', () => {
  const params = new URLSearchParams('mol_id=550e8400e29b41d4a716446655440000')
  const result = parseShareParams(params)
  assert.equal(result.error, 'Invalid mol_id format')
})

test('parseShareParams rejects mixed when smiles is bad', () => {
  const params = new URLSearchParams('smiles=&mol_id=550e8400-e29b-41d4-a716-446655440000')
  const result = parseShareParams(params)
  assert.equal(result.error, 'Empty SMILES parameter')
})

test('encodeShareUrl produces correct ?smiles= URL', () => {
  const url = encodeShareUrl({ smiles: 'CCO' })
  assert.equal(url, '/draw?smiles=CCO')
})

test('encodeShareUrl produces correct ?mol_id= URL', () => {
  const url = encodeShareUrl({ molId: '550e8400-e29b-41d4-a716-446655440000' })
  assert.equal(url, '/draw?mol_id=550e8400-e29b-41d4-a716-446655440000')
})

test('encodeShareUrl returns base URL when no params', () => {
  const url = encodeShareUrl({})
  assert.equal(url, '/draw')
})

test('encodeShareUrl combines smiles and mol_id', () => {
  const url = encodeShareUrl({ smiles: 'CCO', molId: '550e8400-e29b-41d4-a716-446655440000' })
  assert.ok(url.includes('smiles=CCO'))
  assert.ok(url.includes('mol_id=550e8400-e29b-41d4-a716-446655440000'))
})

// Run
console.log('Share URL Tests')
runTests()
