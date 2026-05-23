/**
 * KetcherEditor component prop interface tests
 * Browser-only component — we test the TypeScript interface shape in Node.
 */

import assert from 'node:assert/strict'
import type { KetcherEditorProps } from '@/components/molecule-editor/KetcherEditor'

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

test('KetcherEditorProps accepts all optional fields', () => {
  const props: KetcherEditorProps = {
    initialSmiles: 'CCO',
    onChange: (_smiles: string, _mol: string) => {},
    onInit: (_k) => {},
    onReady: () => {},
    height: 600,
  }
  assert.equal(typeof props.initialSmiles, 'string')
  assert.equal(typeof props.onChange, 'function')
  assert.equal(typeof props.onInit, 'function')
  assert.equal(typeof props.onReady, 'function')
  assert.equal(typeof props.height, 'number')
})

test('KetcherEditorProps allows empty object (all optional)', () => {
  const minimal: KetcherEditorProps = {}
  assert.equal(typeof minimal, 'object')
})

test('KetcherEditorProps height accepts string value', () => {
  const props: KetcherEditorProps = { height: '100%' }
  assert.equal(props.height, '100%')
})

// Run
console.log('Ketcher Editor Props Tests')
runTests()
