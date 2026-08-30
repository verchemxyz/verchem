/**
 * Ketcher editor interface and source-level integration contracts.
 * Browser-only components — keep these checks narrow enough to run in Node.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { KetcherEditorProps } from '@/components/molecule-editor/KetcherEditor'

type TestFn = () => void | Promise<void>
interface TestCase { name: string; fn: TestFn }

const tests: TestCase[] = []
const ketcherEditorSource = readFileSync(
  new URL('../components/molecule-editor/KetcherEditor.tsx', import.meta.url),
  'utf8'
)
const drawPageSource = readFileSync(
  new URL('../app/draw/page.tsx', import.meta.url),
  'utf8'
)

function getButtonBlock(onClickHandler: string): string {
  const buttonBlocks = drawPageSource.match(/<Button\b[\s\S]*?<\/Button>/g) ?? []
  const block = buttonBlocks.find((candidate) =>
    candidate.includes(`onClick={${onClickHandler}}`)
  )
  assert.ok(block, `Expected a Button wired to ${onClickHandler}`)
  return block
}

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

test('KetcherEditor imports the Ketcher stylesheet required for its UI', () => {
  assert.match(
    ketcherEditorSource,
    /^\s*import\s+['"]ketcher-react\/dist\/index\.css['"];?\s*$/m,
    'Ketcher renders without its layout and icon styles when the package stylesheet is omitted'
  )
})

test('/draw visibly labels the export controls', () => {
  assert.match(
    drawPageSource,
    /<p\b[^>]*>\s*Export structure\s*<\/p>/,
    'Export formats need a visible group label, not only an accessibility label'
  )
})

test('/draw disables every export control until a structure exists', () => {
  const exportHandlers = [
    'handleExportSmiles',
    'handleExportMol',
    'handleExportInchi',
    'handleExportPng',
    'handleExportSvg',
  ]

  for (const handler of exportHandlers) {
    assert.match(
      getButtonBlock(handler),
      /disabled=\{!ketcher\s*\|\|\s*!hasStructure\}/,
      `${handler} must stay disabled until the editor is ready and contains a structure`
    )
  }
})

test('/draw disables Save to Library until a structure exists', () => {
  assert.match(
    getButtonBlock('handleSaveClick'),
    /disabled=\{!ketcher\s*\|\|\s*!hasStructure\}/,
    'Save must stay disabled until the editor is ready and contains a structure'
  )
})

test('/draw guides users when the editor has no structure', () => {
  assert.match(
    drawPageSource,
    /\{!hasStructure\s*&&\s*\([\s\S]*?Draw or paste a structure in the editor to enable export and saving\.[\s\S]*?\)\}/,
    'The empty editor needs guidance that explains how to enable export and saving'
  )
})

// Run
console.log('Ketcher Editor Props Tests')
runTests()
