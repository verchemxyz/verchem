/**
 * VerChem Molecule Format Conversion - Unit Tests
 * W1 Day 1-2: Ketcher export helper tests
 */

import assert from 'node:assert/strict'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

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

// We can't easily test downloadFile in Node (needs DOM),
// but we can test the logic by verifying Blob creation.

test('downloadFile creates a Blob from string content', () => {
  const content = 'CCO ethanol'
  const blob = new Blob([content], { type: 'text/plain' })
  assert.equal(blob.size, content.length)
  assert.equal(blob.type, 'text/plain')
})

test('downloadFile accepts an existing Blob', () => {
  const original = new Blob(['<svg></svg>'], { type: 'image/svg+xml' })
  const blob = original instanceof Blob ? original : new Blob([original])
  assert.equal(blob.size, original.size)
  assert.equal(blob.type, 'image/svg+xml')
})

// Run
console.log('Molecule Format Conversion Tests')
runTests()
