/**
 * SMILES detection helper tests
 */

import assert from 'node:assert/strict'
import { looksLikeSmiles } from '@/lib/molecule/smiles-detect'

type TestFn = () => void
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
      fn()
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

test('SMILES: simple chain CCO (ethanol)', () => {
  assert.equal(looksLikeSmiles('CCO'), true)
})

test('SMILES: benzene c1ccccc1', () => {
  assert.equal(looksLikeSmiles('c1ccccc1'), true)
})

test('SMILES: with brackets [Na+]', () => {
  assert.equal(looksLikeSmiles('[Na+]'), true)
})

test('SMILES: with double bond C=C', () => {
  assert.equal(looksLikeSmiles('C=C'), true)
})

test('SMILES: with stereo C/C=C/C', () => {
  assert.equal(looksLikeSmiles('C/C=C/C'), true)
})

test('SMILES: branch C(C)C (parens not followed by digit)', () => {
  assert.equal(looksLikeSmiles('C(C)C'), true)
})

test('Formula: water H2O', () => {
  assert.equal(looksLikeSmiles('H2O'), false)
})

test('Formula: glucose C6H12O6', () => {
  assert.equal(looksLikeSmiles('C6H12O6'), false)
})

test('Formula: calcium hydroxide Ca(OH)2 (parens followed by digit)', () => {
  assert.equal(looksLikeSmiles('Ca(OH)2'), false)
})

test('Empty string', () => {
  assert.equal(looksLikeSmiles(''), false)
})

test('Whitespace only', () => {
  assert.equal(looksLikeSmiles('   '), false)
})

// Run
console.log('SMILES Detection Tests')
runTests()
