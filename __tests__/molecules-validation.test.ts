/**
 * Molecule validation helper tests
 */

import assert from 'node:assert/strict'
import {
  validateCreateMoleculeInput,
  validateUpdateMoleculeInput,
  MAX_SMILES_LEN,
  MAX_NAME_LEN,
  MAX_NOTES_LEN,
  MAX_MOL_BLOCK_LEN,
  MAX_TAG_LEN,
  MAX_TAGS_COUNT,
} from '@/lib/molecule/validation'

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

// --- Create validation tests ---

test('create: accepts valid input (all fields)', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Ethanol',
    smiles: 'CCO',
    mol_block: 'test mol',
    inchi: 'InChI=1/C2H6O/c1-2-3/h3H,2H2,1H3',
    inchi_key: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
    tags: ['organic', 'solvent'],
    notes: 'A common solvent',
    is_public: false,
  })
  assert.equal(errors.length, 0)
})

test('create: accepts minimal valid input (name + smiles only)', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Methane',
    smiles: 'C',
  })
  assert.equal(errors.length, 0)
})

test('create: rejects empty name', () => {
  const errors = validateCreateMoleculeInput({
    name: '',
    smiles: 'CCO',
  })
  assert.ok(errors.some((e) => e.includes('Name is required')))
})

test('create: rejects name > 200 chars', () => {
  const errors = validateCreateMoleculeInput({
    name: 'A'.repeat(MAX_NAME_LEN + 1),
    smiles: 'CCO',
  })
  assert.ok(errors.some((e) => e.includes('Name must be at most')))
})

test('create: rejects missing smiles', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: '',
  })
  assert.ok(errors.some((e) => e.includes('SMILES is required')))
})

test('create: rejects smiles > 2000 chars', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'C'.repeat(MAX_SMILES_LEN + 1),
  })
  assert.ok(errors.some((e) => e.includes('SMILES must be at most')))
})

test('create: rejects non-string mol_block', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    mol_block: 123,
  })
  assert.ok(errors.some((e) => e.includes('MOL block must be a string')))
})

test('create: rejects mol_block > 50000 chars', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    mol_block: 'M'.repeat(MAX_MOL_BLOCK_LEN + 1),
  })
  assert.ok(errors.some((e) => e.includes('MOL block must be at most')))
})

test('create: rejects non-string inchi', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    inchi: 123,
  })
  assert.ok(errors.some((e) => e.includes('InChI must be a string')))
})

test('create: rejects non-string inchi_key', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    inchi_key: 123,
  })
  assert.ok(errors.some((e) => e.includes('InChIKey must be a string')))
})

test('create: rejects inchi_key > 50 chars', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    inchi_key: 'A'.repeat(51),
  })
  assert.ok(errors.some((e) => e.includes('InChIKey must be at most')))
})

test('create: rejects non-string notes', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    notes: 123,
  })
  assert.ok(errors.some((e) => e.includes('Notes must be a string')))
})

test('create: rejects notes > 2000 chars', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    notes: 'N'.repeat(MAX_NOTES_LEN + 1),
  })
  assert.ok(errors.some((e) => e.includes('Notes must be at most')))
})

test('create: rejects non-array tags', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    tags: 'organic',
  })
  assert.ok(errors.some((e) => e.includes('Tags must be an array')))
})

test('create: rejects tags > 20 items', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    tags: Array.from({ length: MAX_TAGS_COUNT + 1 }, (_, i) => `tag${i}`),
  })
  assert.ok(errors.some((e) => e.includes('At most 20 tags allowed')))
})

test('create: rejects tag element > 50 chars', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    tags: ['A'.repeat(MAX_TAG_LEN + 1)],
  })
  assert.ok(errors.some((e) => e.includes('Each tag must be a string')))
})

test('create: rejects non-boolean is_public', () => {
  const errors = validateCreateMoleculeInput({
    name: 'Test',
    smiles: 'CCO',
    is_public: 'yes',
  })
  assert.ok(errors.some((e) => e.includes('is_public must be a boolean')))
})

// --- Update validation tests ---

test('update: accepts partial updates (name only)', () => {
  const errors = validateUpdateMoleculeInput({ name: 'New Name' })
  assert.equal(errors.length, 0)
})

test('update: accepts no-op (empty object)', () => {
  const errors = validateUpdateMoleculeInput({})
  assert.equal(errors.length, 0)
})

test('update: rejects empty name', () => {
  const errors = validateUpdateMoleculeInput({ name: '' })
  assert.ok(errors.some((e) => e.includes('Name must be a non-empty string')))
})

test('update: rejects non-string notes', () => {
  const errors = validateUpdateMoleculeInput({ notes: 123 })
  assert.ok(errors.some((e) => e.includes('Notes must be a string')))
})

test('update: rejects non-array tags', () => {
  const errors = validateUpdateMoleculeInput({ tags: 'single' })
  assert.ok(errors.some((e) => e.includes('Tags must be an array')))
})

test('update: rejects non-boolean is_public', () => {
  const errors = validateUpdateMoleculeInput({ is_public: 1 })
  assert.ok(errors.some((e) => e.includes('is_public must be a boolean')))
})

// Run
console.log('Molecules Validation Tests')
runTests()
