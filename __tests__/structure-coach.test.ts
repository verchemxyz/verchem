import assert from 'node:assert/strict'
import {
  normalizeStructureCheckError,
  normalizeStructureCheckResult,
} from '@/lib/molecule/structure-check'
import { combineStructureCoachAnalysis } from '@/lib/molecule/structure-coach'
import {
  validateStructureWithRDKit,
  type StructureValidationEngine,
} from '@/lib/rdkit/structure-validation'

type TestFn = () => void | Promise<void>
interface TestCase { name: string; fn: TestFn }

const tests: TestCase[] = []

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

const connectedMolEngine: StructureValidationEngine = {
  get_mol: () => ({
    is_valid: () => true,
    get_smiles: () => 'CCO',
    get_json: () => JSON.stringify({
      molecules: [{
        atoms: [{}, {}, {}],
        bonds: [{ atoms: [0, 1] }, { atoms: [1, 2] }],
      }],
    }),
    delete: () => {},
  }),
}

test('reports clear only when both independent checks complete without findings', () => {
  const analysis = combineStructureCoachAnalysis(
    normalizeStructureCheckResult({}),
    {
      result: validateStructureWithRDKit(connectedMolEngine, 'CCO'),
      error: null,
    }
  )

  assert.equal(analysis.status, 'clear')
  assert.deepEqual(analysis.issues, [])
  assert.equal(analysis.hasBlockingFindings, false)
  assert.equal(analysis.actionError, null)
})

test('merges Indigo errors and conservative RDKit advisories without hiding either source', () => {
  const saltEngine: StructureValidationEngine = {
    get_mol: () => ({
      is_valid: () => true,
      get_smiles: () => '[Cl-].[Na+]',
      get_json: () => JSON.stringify({
        molecules: [{ atoms: [{ chg: -1 }, { chg: 1 }], bonds: [] }],
      }),
      delete: () => {},
    }),
  }
  const analysis = combineStructureCoachAnalysis(
    normalizeStructureCheckResult({ valence: 'Atom 4 has unusual valence.' }),
    {
      result: validateStructureWithRDKit(saltEngine, '[Na+].[Cl-]'),
      error: null,
    }
  )

  assert.equal(analysis.status, 'flagged')
  assert.deepEqual(analysis.issues.map((issue) => issue.source), ['Indigo', 'RDKit'])
  assert.equal(analysis.issues[0]?.severity, 'error')
  assert.equal(analysis.issues[1]?.severity, 'info')
  assert.equal(analysis.hasBlockingFindings, true)
})

test('treats an RDKit sanitize failure as a review finding, not proof of invalid chemistry', () => {
  const analysis = combineStructureCoachAnalysis(
    normalizeStructureCheckResult({ query: 'Structure contains query features.' }),
    {
      result: validateStructureWithRDKit({ get_mol: () => null }, '[C,N]'),
      error: null,
    }
  )

  assert.equal(analysis.status, 'flagged')
  assert.equal(analysis.issues.at(-1)?.severity, 'warning')
  assert.match(analysis.issues.at(-1)?.message ?? '', /unsupported query features/i)
})

test('keeps partial results visible when one structural engine is unavailable', () => {
  const analysis = combineStructureCoachAnalysis(
    normalizeStructureCheckError('Indigo unavailable'),
    {
      result: validateStructureWithRDKit(connectedMolEngine, 'CCO'),
      error: null,
    }
  )

  assert.equal(analysis.status, 'flagged')
  assert.deepEqual(analysis.issues.map((issue) => issue.id), ['indigo:unavailable'])
  assert.equal(analysis.issues[0]?.severity, 'info')
  assert.equal(analysis.actionError, null)
})

test('fails transparently when neither engine can complete the check', () => {
  const analysis = combineStructureCoachAnalysis(
    normalizeStructureCheckError('Indigo unavailable'),
    { result: null, error: 'RDKit unavailable' }
  )

  assert.equal(analysis.status, 'unavailable')
  assert.deepEqual(analysis.issues, [])
  assert.match(analysis.actionError ?? '', /Neither structural engine/i)
})

async function runTests() {
  let passed = 0
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      await fn()
      passed++
      console.log(`  ✅ ${name}`)
    } catch (error: unknown) {
      failed++
      console.error(`  ❌ ${name}`)
      console.error('    ', error instanceof Error ? error.message : String(error))
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

console.log('Structure Coach Tests')
runTests().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
