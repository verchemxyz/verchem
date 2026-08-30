/**
 * Ketcher/Indigo structure-check normalization tests.
 */

import assert from 'node:assert/strict'
import {
  STRUCTURE_CHECK_METADATA,
  STRUCTURE_CHECK_TYPES,
  normalizeStructureCheckError,
  normalizeStructureCheckResult,
  runKetcherStructureCheck,
  type StructureCheckClient,
} from '@/lib/molecule/structure-check'

type TestFn = () => void | Promise<void>
interface TestCase { name: string; fn: TestFn }

const tests: TestCase[] = []

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

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

test('covers every Ketcher 3.17.2 structure-check type in UI order', () => {
  assert.deepEqual(STRUCTURE_CHECK_TYPES, [
    'valence',
    'radicals',
    'pseudoatoms',
    'stereo',
    'query',
    'overlapping_atoms',
    'overlapping_bonds',
    'rgroups',
    'chiral',
    '3d',
    'chiral_flag',
  ])
})

test('assigns deterministic labels and conservative severities', () => {
  assert.equal(STRUCTURE_CHECK_METADATA.valence.severity, 'error')
  assert.equal(STRUCTURE_CHECK_METADATA.stereo.severity, 'error')
  assert.equal(STRUCTURE_CHECK_METADATA.overlapping_atoms.severity, 'error')
  assert.equal(STRUCTURE_CHECK_METADATA.overlapping_bonds.severity, 'error')
  assert.equal(STRUCTURE_CHECK_METADATA.chiral.severity, 'warning')
  assert.equal(STRUCTURE_CHECK_METADATA.radicals.severity, 'warning')
  assert.equal(STRUCTURE_CHECK_METADATA.pseudoatoms.severity, 'warning')
  assert.equal(STRUCTURE_CHECK_METADATA.query.severity, 'warning')
  assert.equal(STRUCTURE_CHECK_METADATA.rgroups.label, 'R-Groups')
  assert.equal(STRUCTURE_CHECK_METADATA['3d'].label, '3D Structure')
  assert.equal(STRUCTURE_CHECK_METADATA.chiral_flag.label, 'Chiral Flag')
})

test('normalizes, trims, orders, and summarizes known Indigo findings', () => {
  const report = normalizeStructureCheckResult({
    radicals: '  Structure contains a radical.  ',
    valence: ' Structure contains 1 atom\nwith bad valence ',
    stereo: '  Ambiguous stereochemistry  ',
  })

  assert.equal(report.status, 'issues')
  assert.deepEqual(report.issues.map((issue) => issue.type), [
    'valence',
    'radicals',
    'stereo',
  ])
  assert.equal(report.issues[0]?.message, 'Structure contains 1 atom with bad valence')
  assert.deepEqual(report.summary, {
    errorCount: 2,
    warningCount: 1,
    infoCount: 0,
    totalCount: 3,
  })
  assert.equal(report.hasBlockingErrors, true)
})

test('keeps the presence of chirality non-blocking', () => {
  const report = normalizeStructureCheckResult({
    chiral: 'Structure contains chirality',
  })

  assert.equal(report.issues[0]?.severity, 'warning')
  assert.equal(report.hasBlockingErrors, false)
})

test('canonicalizes Indigo aliases and deduplicates identical findings', () => {
  const report = normalizeStructureCheckResult({
    OVERLAP_BOND: ' Bonds overlap ',
    overlapping_bonds: 'Bonds overlap',
    pseudoatom: ' Contains pseudoatom ',
    r_group: ' Contains an R-group ',
  })

  assert.deepEqual(report.issues.map((issue) => issue.type), [
    'pseudoatoms',
    'overlapping_bonds',
    'rgroups',
  ])
  assert.equal(report.summary.totalCount, 3)
})

test('keeps future Indigo keys as non-blocking humanized diagnostics', () => {
  const report = normalizeStructureCheckResult({
    FUTURE_COORDINATE_NOTICE: '  New diagnostic from Indigo  ',
  })

  assert.equal(report.status, 'issues')
  assert.deepEqual(report.issues, [])
  assert.deepEqual(report.diagnostics, [
    {
      type: 'future_coordinate_notice',
      label: 'Future Coordinate Notice',
      severity: 'warning',
      message: 'New diagnostic from Indigo',
    },
  ])
  assert.equal(report.hasBlockingErrors, false)
})

test('omits blank messages instead of creating empty issues', () => {
  const report = normalizeStructureCheckResult({
    valence: '   ',
    UNKNOWN_NOTICE: '\n\t',
  })

  assert.equal(report.status, 'clear')
  assert.equal(report.summary.totalCount, 0)
})

test('returns clear for an empty successful Indigo result', () => {
  const report = normalizeStructureCheckResult({})

  assert.equal(report.status, 'clear')
  assert.equal(report.error, null)
  assert.equal(report.hasBlockingErrors, false)
})

test('returns a stable error report for invalid and thrown values', () => {
  const invalid = normalizeStructureCheckResult(null)
  const unknownError = normalizeStructureCheckError({ code: 'INDIGO_DOWN' })

  assert.equal(invalid.status, 'error')
  assert.equal(invalid.error, 'Structure check returned an invalid result.')
  assert.equal(unknownError.status, 'error')
  assert.equal(unknownError.error, 'Structure check failed.')
})

test('does not call Indigo for an empty structure', async () => {
  let calls = 0
  const client: StructureCheckClient = {
    check: async () => {
      calls++
      return {}
    },
  }

  const report = await runKetcherStructureCheck(client, '  \n ')

  assert.equal(report.status, 'empty')
  assert.equal(calls, 0)
})

test('calls Indigo with trimmed KET and all official checks by default', async () => {
  let receivedStruct = ''
  let receivedTypes: readonly string[] = []
  const client: StructureCheckClient = {
    check: async (data) => {
      receivedStruct = data.struct
      receivedTypes = data.types
      return { valence: 'Bad valence' }
    },
  }

  const report = await runKetcherStructureCheck(client, '  {"root": {}}  ')

  assert.equal(receivedStruct, '{"root": {}}')
  assert.deepEqual(receivedTypes, STRUCTURE_CHECK_TYPES)
  assert.equal(report.status, 'issues')
})

test('deduplicates requested checks into deterministic Ketcher order', async () => {
  let receivedTypes: readonly string[] = []
  const client: StructureCheckClient = {
    check: async (data) => {
      receivedTypes = data.types
      return {}
    },
  }

  const report = await runKetcherStructureCheck(client, 'ket', {
    types: ['chiral_flag', 'valence', 'chiral_flag', 'radicals'],
  })

  assert.deepEqual(receivedTypes, ['valence', 'radicals', 'chiral_flag'])
  assert.deepEqual(report.checkedTypes, ['valence', 'radicals', 'chiral_flag'])
})

test('normalizes rejected Indigo checks without throwing into UI code', async () => {
  const client: StructureCheckClient = {
    check: async () => {
      throw new Error('  Indigo worker unavailable  ')
    },
  }

  const report = await runKetcherStructureCheck(client, 'ket')

  assert.equal(report.status, 'error')
  assert.equal(report.error, 'Indigo worker unavailable')
  assert.equal(report.hasBlockingErrors, false)
})

console.log('Structure Check Tests')
runTests().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
