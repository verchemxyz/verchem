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
const structureCoachSource = readFileSync(
  new URL('../components/molecule-editor/StructureCoach.tsx', import.meta.url),
  'utf8'
)

function getButtonBlock(source: string, onClickHandler: string): string {
  const buttonBlocks = source.match(/<Button\b[\s\S]*?<\/Button>/g) ?? []
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
    onStructureChange: (_hasStructure: boolean) => {},
    onInit: (_k) => {},
    onReady: () => {},
    height: 600,
  }
  assert.equal(typeof props.initialSmiles, 'string')
  assert.equal(typeof props.onChange, 'function')
  assert.equal(typeof props.onStructureChange, 'function')
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

test('KetcherEditor reports structure presence as a boolean', () => {
  let reported: boolean | undefined
  const props: KetcherEditorProps = {
    onStructureChange: (hasStructure: boolean) => {
      reported = hasStructure
    },
  }

  props.onStructureChange?.(true)
  assert.equal(reported, true)
  assert.match(
    ketcherEditorSource,
    /onStructureChangeRef\.current\?\.\(!ketcher\.editor\.struct\(\)\.isBlank\(\)\)/,
    'Structure presence must come from the editor structure instead of an async export result'
  )
})

test('KetcherEditor ignores stale async exports and clears stale values on failure', () => {
  assert.match(
    ketcherEditorSource,
    /changeVersionRef\.current \+= 1/,
    'Every editor change needs a monotonically increasing revision'
  )
  assert.match(
    ketcherEditorSource,
    /if \(serializationRunningRef\.current\) return;[\s\S]*?serializationRunningRef\.current = true;[\s\S]*?while \(true\)/,
    'Rapid changes must be coalesced into one serialized Ketcher worker loop'
  )
  assert.match(
    ketcherEditorSource,
    /if \(changeVersion !== changeVersionRef\.current\) continue/,
    'An older async export must not overwrite the latest structure'
  )
  assert.match(
    ketcherEditorSource,
    /if \(changeVersion === changeVersionRef\.current\) \{\s*onChangeRef\.current\?\.\('', ''\)/,
    'The latest failed export must clear stale molecule values'
  )
})

test('KetcherEditor preserves page position when Ketcher focuses on mount', () => {
  assert.match(
    ketcherEditorSource,
    /mountScrollPositionRef = useRef\([\s\S]*?window\.scrollX[\s\S]*?window\.scrollY/,
    'The editor must capture the page position before Ketcher initializes'
  )
  assert.match(
    ketcherEditorSource,
    /window\.scrollTo\(mountScrollPosition\.x, mountScrollPosition\.y\)/,
    'Ketcher initialization must not jump mobile users past the page controls'
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
      getButtonBlock(drawPageSource, handler),
      /disabled=\{!ketcher\s*\|\|\s*!hasStructure\s*\|\|\s*isExporting\}/,
      `${handler} must stay disabled until the editor is ready, contains a structure, and no export is running`
    )
  }
})

test('/draw serializes rapid export requests and exposes busy state', () => {
  assert.match(
    drawPageSource,
    /if \(exportInFlightRef\.current(?: \|\| !hasStructureRef\.current)?\) return;[\s\S]*?exportInFlightRef\.current = true;/,
    'Rapid export taps must not start concurrent Ketcher operations'
  )
  assert.match(
    drawPageSource,
    /role="group"\s*aria-label="Export structure"\s*aria-busy=\{isExporting\}/,
    'The export control group must expose its in-flight state'
  )
})

test('/draw disables Save to Library until a structure exists', () => {
  assert.match(
    getButtonBlock(drawPageSource, 'handleSaveClick'),
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

test('/draw invalidates coach results on every structure revision', () => {
  assert.match(
    drawPageSource,
    /const nextRevision = structureRevisionRef\.current \+ 1;\s*structureRevisionRef\.current = nextRevision;/,
    'Structure changes need a monotonic revision for stale-result protection'
  )
  assert.match(
    drawPageSource,
    /checkRequestRef\.current \+= 1;[\s\S]*?setCoachIssues\(\[\]\);[\s\S]*?setCoachError\(null\);[\s\S]*?setCoachStatus\(nextHasStructure \? 'dirty' : 'empty'\);/,
    'A structure edit must invalidate in-flight requests and reset stale coach output'
  )
})

test('/draw rejects stale automatic-check results by request and structure revision', () => {
  assert.match(
    drawPageSource,
    /const checkedRevision = structureRevisionRef\.current;[\s\S]*?const requestId = checkRequestRef\.current \+ 1;[\s\S]*?checkRequestRef\.current = requestId;/,
    'Each structure analysis needs request and structure revision snapshots'
  )
  assert.match(
    drawPageSource,
    /requestId !== checkRequestRef\.current\s*\|\|\s*checkedRevision !== structureRevisionRef\.current/,
    'A stale request or revision must not publish coach results'
  )
  assert.match(
    drawPageSource,
    /useEffect\(\(\) => \{\s*if \(!autoCheck[\s\S]*?autoCheckTimerRef\.current = window\.setTimeout\([\s\S]*?void runStructureAnalysis\(\);[\s\S]*?\}, 700\);[\s\S]*?\}, \[[\s\S]*?structureRevision,[\s\S]*?\]\);/,
    'Auto-check must react to each committed structure revision'
  )
})

test('Structure Coach announces status changes politely', () => {
  assert.match(
    structureCoachSource,
    /role="status"\s*aria-live="polite"\s*aria-atomic="true"/,
    'Coach status changes need one atomic polite live region'
  )
})

test('Structure Coach exposes Auto-check as a semantic switch', () => {
  assert.match(
    structureCoachSource,
    /role="switch"\s*aria-checked=\{autoCheck\}/,
    'Auto-check must expose its checked state to assistive technology'
  )
})

test('Structure Coach gates Check and Tidy while unavailable or busy', () => {
  assert.match(
    structureCoachSource,
    /const controlsDisabled = disabled \|\| isChecking \|\| isTidying/,
    'Coach actions need one shared unavailable/busy gate'
  )

  for (const handler of ['onCheck', 'onTidy']) {
    assert.match(
      getButtonBlock(structureCoachSource, handler),
      /disabled=\{controlsDisabled\}/,
      `${handler} must use the shared unavailable/busy gate`
    )
  }
})

test('Structure Coach exposes findings as a labelled region', () => {
  assert.match(
    structureCoachSource,
    /role="region"\s*aria-labelledby="structure-findings-title"/,
    'Findings need a discoverable labelled region'
  )
  assert.match(
    structureCoachSource,
    /id="structure-findings-title"/,
    'The findings region label must resolve to a visible heading'
  )
})

test('/draw exposes shared-structure loading without hiding editor busy state', () => {
  assert.match(
    drawPageSource,
    /aria-busy=\{isLoadingShared \|\| isTidying\}/,
    'The editor wrapper must expose shared loading and tidy activity'
  )
  assert.match(
    drawPageSource,
    /\{isLoadingShared && \([\s\S]*?role="status"\s*aria-live="polite"[\s\S]*?Loading shared structure…/,
    'The shared-structure overlay needs an accessible loading announcement'
  )
})

test('/draw keeps the dismiss-error control touch accessible', () => {
  const dismissButton = (drawPageSource.match(/<button\b[\s\S]*?<\/button>/g) ?? [])
    .find((candidate) => candidate.includes('setShareError(null)'))
  assert.ok(dismissButton, 'Expected a button that dismisses the share error')
  assert.match(dismissButton, /min-h-\[44px\]/)
  assert.match(dismissButton, /min-w-\[44px\]/)
})

test('/draw does not give alerts conflicting live-region politeness', () => {
  assert.doesNotMatch(
    drawPageSource,
    /<[^>]*(?:role="alert"[^>]*aria-live|aria-live[^>]*role="alert")[^>]*>/,
    'role=alert already has assertive live-region semantics'
  )
})

// Run
console.log('Ketcher Editor Props Tests')
runTests()
