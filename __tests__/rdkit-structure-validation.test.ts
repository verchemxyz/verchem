/**
 * Independent secondary structure validation tests.
 *
 * Uses real RDKit WASM for chemistry semantics and small injected doubles for
 * failure-path memory cleanup that real MinimalLib cannot deterministically
 * trigger on demand.
 */

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import {
  validateStructureCandidatesWithRDKit,
  validateStructureWithRDKit,
  type StructureValidationEngine,
  type StructureValidationMol,
  type StructureWarningCode,
} from '@/lib/rdkit/structure-validation'

type TestFunction = () => void | Promise<void>

interface TestCase {
  name: string
  run: TestFunction
}

const tests: TestCase[] = []

function test(name: string, run: TestFunction): void {
  tests.push({ name, run })
}

async function loadRealRDKit(): Promise<StructureValidationEngine> {
  const require = createRequire(join(process.cwd(), 'package.json'))
  const imported = require('@rdkit/rdkit') as
    | { default?: (options: { locateFile: () => string }) => Promise<StructureValidationEngine> }
    | ((options: { locateFile: () => string }) => Promise<StructureValidationEngine>)
  const init = typeof imported === 'function' ? imported : imported.default
  if (!init) throw new Error('RDKit loader unavailable')
  const wasmPath = require.resolve('@rdkit/rdkit/dist/RDKit_minimal.wasm')
  return init({ locateFile: () => wasmPath })
}

function warningCodes(result: ReturnType<typeof validateStructureWithRDKit>): StructureWarningCode[] {
  return result.warnings.map((warning) => warning.code)
}

interface MockMolOptions {
  valid?: boolean
  canonicalSmiles?: string
  json?: string
  getSmilesError?: boolean
  getJsonError?: boolean
}

function createTrackedMol(options: MockMolOptions = {}): {
  mol: StructureValidationMol
  deleteCount: () => number
} {
  let deletes = 0
  const mol: StructureValidationMol = {
    is_valid: () => options.valid ?? true,
    get_smiles: () => {
      if (options.getSmilesError) throw new Error('get_smiles failed')
      return options.canonicalSmiles ?? 'CCO'
    },
    get_json: () => {
      if (options.getJsonError) throw new Error('get_json failed')
      return options.json ?? JSON.stringify({
        molecules: [{
          atoms: [{}, {}, {}],
          bonds: [{ atoms: [0, 1] }, { atoms: [1, 2] }],
        }],
      })
    },
    delete: () => {
      deletes += 1
    },
  }
  return { mol, deleteCount: () => deletes }
}

async function main(): Promise<void> {
  const rdkit = await loadRealRDKit()

  test('accepts and canonicalizes a sanitized connected molecule', () => {
    const result = validateStructureWithRDKit(rdkit, ' C1=CC=CC=C1 ')
    assert.equal(result.valid, true)
    if (!result.valid) return
    assert.equal(result.canonicalSmiles, 'c1ccccc1')
    assert.equal(result.inputWasNormalized, true)
    assert.equal(result.fragmentCount, 1)
    assert.equal(result.atomCount, 6)
    assert.equal(result.analysisComplete, true)
    assert.deepEqual(result.warnings, [])
  })

  test('rejects empty input before asking RDKit to parse', () => {
    let calls = 0
    const engine: StructureValidationEngine = {
      get_mol: () => {
        calls += 1
        return null
      },
    }
    const result = validateStructureWithRDKit(engine, '   ')
    assert.equal(result.valid, false)
    assert.equal(result.failureCode, 'empty_input')
    assert.equal(calls, 0)
  })

  test('rejects malformed or sanitize-invalid structures', () => {
    for (const input of ['C1CC', 'C(C)(C)(C)(C)C']) {
      const result = validateStructureWithRDKit(rdkit, input)
      assert.equal(result.valid, false, `${input} must fail parse/sanitize`)
      assert.equal(result.failureCode, 'parse_or_sanitize_failed')
    }
  })

  test('falls back to an equivalent serialization before reporting a parse failure', () => {
    const calls: string[] = []
    const tracked = createTrackedMol({ canonicalSmiles: '[Cl-].[Na+]' })
    const engine: StructureValidationEngine = {
      get_mol: (input) => {
        calls.push(input)
        return input === 'browser-incompatible-smiles' ? null : tracked.mol
      },
    }

    const result = validateStructureCandidatesWithRDKit(engine, [
      'browser-incompatible-smiles',
      'compatible-mol-block',
    ])
    assert.equal(result.valid, true)
    assert.deepEqual(calls, ['browser-incompatible-smiles', 'compatible-mol-block'])
    assert.equal(tracked.deleteCount(), 1)
  })

  test('preserves blank MOL header lines when using the Ketcher fallback', () => {
    const ketcherMolBlock = [
      '',
      '  Ketcher  08302600002D 1   1.00000     0.00000     0',
      '',
      '  1  0  0  0  0  0            999 V2000',
      '    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0',
      'M  END',
      '',
    ].join('\n')

    const result = validateStructureCandidatesWithRDKit(rdkit, [
      'C1CC',
      ketcherMolBlock,
    ])
    assert.equal(result.valid, true)
    if (!result.valid) return
    assert.equal(result.canonicalSmiles, 'C')
    assert.equal(result.atomCount, 1)
  })

  test('keeps a salt valid and reports disconnected components without guessing intent', () => {
    const result = validateStructureWithRDKit(rdkit, '[Na+].[Cl-]')
    assert.equal(result.valid, true)
    if (!result.valid) return
    assert.equal(result.fragmentCount, 2)
    assert.equal(result.netFormalCharge, 0)
    assert.deepEqual(warningCodes(result), ['disconnected_components'])
  })

  test('keeps a charge-separated single component valid without a net-charge warning', () => {
    const result = validateStructureWithRDKit(rdkit, '[O-][N+](=O)O')
    assert.equal(result.valid, true)
    if (!result.valid) return
    assert.equal(result.fragmentCount, 1)
    assert.equal(result.netFormalCharge, 0)
    assert.ok(!warningCodes(result).includes('net_formal_charge'))
  })

  test('keeps radicals valid and emits a normalized advisory', () => {
    const result = validateStructureWithRDKit(rdkit, '[CH3]')
    assert.equal(result.valid, true)
    if (!result.valid) return
    assert.equal(result.radicalAtomCount, 1)
    assert.deepEqual(warningCodes(result), ['radical_atoms'])
  })

  test('keeps unusual valid ions and isotopes valid with factual advisories', () => {
    const ion = validateStructureWithRDKit(rdkit, '[Fe+2]')
    assert.equal(ion.valid, true)
    if (ion.valid) {
      assert.equal(ion.netFormalCharge, 2)
      assert.deepEqual(warningCodes(ion), ['net_formal_charge'])
    }

    const isotope = validateStructureWithRDKit(rdkit, '[13CH4]')
    assert.equal(isotope.valid, true)
    if (isotope.valid) {
      assert.equal(isotope.isotopeAtomCount, 1)
      assert.deepEqual(warningCodes(isotope), ['isotopic_atoms'])
    }
  })

  test('deletes an allocated molecule when is_valid returns false', () => {
    const tracked = createTrackedMol({ valid: false })
    const result = validateStructureWithRDKit({ get_mol: () => tracked.mol }, 'C')
    assert.equal(result.valid, false)
    assert.equal(tracked.deleteCount(), 1)
  })

  test('deletes an allocated molecule after successful validation', () => {
    const tracked = createTrackedMol()
    const result = validateStructureWithRDKit({ get_mol: () => tracked.mol }, 'CCO')
    assert.equal(result.valid, true)
    assert.equal(tracked.deleteCount(), 1)
  })

  test('deletes an allocated molecule when canonicalization throws', () => {
    const tracked = createTrackedMol({ getSmilesError: true })
    const result = validateStructureWithRDKit({ get_mol: () => tracked.mol }, 'C')
    assert.equal(result.valid, false)
    assert.equal(tracked.deleteCount(), 1)
  })

  test('keeps a parsed molecule valid when detail JSON is unavailable and still deletes it', () => {
    const tracked = createTrackedMol({
      canonicalSmiles: '[Cl-].[Na+]',
      getJsonError: true,
    })
    const result = validateStructureWithRDKit({ get_mol: () => tracked.mol }, '[Na+].[Cl-]')
    assert.equal(result.valid, true)
    if (result.valid) {
      assert.equal(result.analysisComplete, false)
      assert.equal(result.fragmentCount, 2)
      assert.equal(result.atomCount, null)
      assert.deepEqual(warningCodes(result), [
        'disconnected_components',
        'analysis_incomplete',
      ])
    }
    assert.equal(tracked.deleteCount(), 1)
  })

  let passed = 0
  let failed = 0
  for (const testCase of tests) {
    try {
      await testCase.run()
      passed += 1
      console.log(`  ✅ ${testCase.name}`)
    } catch (error: unknown) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.error(`  ❌ ${testCase.name}\n     ${message}`)
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
