/**
 * VerChem Formula Parsing — Unit Tests
 *
 * Covers two defects that produced confidently wrong chemistry:
 *
 * 1. `expandParentheses` used repeated regex replacement, which expanded the
 *    innermost group first and then re-expanded the partially rewritten text,
 *    multiplying nested atoms by the wrong factor:
 *      K4(Fe(CN)6)   -> K4Fe6C6N6   (Fe should be 1)
 *      Fe4(Fe(CN)6)3 -> Fe4Fe6C18N18 (should be Fe4Fe3C18N18)
 *
 * 2. `balanceEquation` accepted any [A-Z][a-z]? token as an element, so a
 *    made-up symbol balanced "successfully", and charged species were read as
 *    subscripts — "Cr3+" as three chromium atoms — producing a balanced-looking
 *    equation for an equation that was never parsed correctly.
 */

import assert from 'node:assert/strict'

import {
  MAX_SUBSCRIPT,
  balanceEquation,
  expandParentheses,
  parseFormula,
} from '@/lib/calculations/equation-balancer'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

const tests: TestCase[] = []

function describe(_name: string, fn: () => void) {
  fn()
}

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

describe('expandParentheses', () => {
  test('expands simple groups', () => {
    assert.equal(expandParentheses('Ca(OH)2'), 'CaO2H2')
    assert.equal(expandParentheses('Cu(NO3)2'), 'CuN2O6')
    assert.equal(expandParentheses('(NH4)2SO4'), 'N2H8SO4')
    assert.equal(expandParentheses('Al2(SO4)3'), 'Al2S3O12')
  })

  test('REGRESSION: nested groups multiply by the correct factor', () => {
    assert.equal(expandParentheses('K4(Fe(CN)6)'), 'K4Fe1C6N6')
    assert.equal(expandParentheses('Fe4(Fe(CN)6)3'), 'Fe4Fe3C18N18')
  })

  test('leaves formulas without groups untouched', () => {
    assert.equal(expandParentheses('H2O'), 'H2O')
    assert.equal(expandParentheses('C6H12O6'), 'C6H12O6')
  })

  test('returns unbalanced input unchanged for the caller to reject', () => {
    assert.equal(expandParentheses('Ca(OH2'), 'Ca(OH2')
    assert.equal(expandParentheses('CaOH)2'), 'CaOH)2')
  })

  test('refuses to produce absurd subscripts rather than losing precision', () => {
    const huge = expandParentheses('(H9007199254740993)2')
    assert.equal(huge, '(H9007199254740993)2', 'an unsafe count must be left unexpanded')
  })
})

describe('parseFormula — strict count contract', () => {
  test('aggregates repeated element symbols', () => {
    assert.deepEqual(parseFormula('CH3COOH'), { C: 2, H: 4, O: 2 })
  })

  test('rejects unsafe, oversized, and oversized aggregate counts', () => {
    assert.throws(() => parseFormula('H9007199254740993'), /subscript out of range/i)
    assert.throws(() => parseFormula(`H${MAX_SUBSCRIPT + 1}`), /subscript out of range/i)
    assert.throws(
      () => parseFormula(`H${MAX_SUBSCRIPT}H1`),
      /aggregate atom count out of range/i
    )
  })
})

describe('balanceEquation — element validation', () => {
  test('balances real molecular equations', () => {
    const r = balanceEquation('H2 + O2 -> H2O')
    assert.equal(r.isBalanced, true)
    assert.equal(r.balanced, '2H2 + O2 → 2H2O')
  })

  test('REGRESSION: nested-group formulas balance correctly', () => {
    const r = balanceEquation('Fe4(Fe(CN)6)3 -> Fe + C + N')
    assert.equal(r.isBalanced, true)
    // 4 + (3 x 1) = 7 iron atoms, not 4 + (3 x 6)
    assert.ok(r.balanced.includes('7Fe'), `expected 7Fe, got: ${r.balanced}`)
  })

  test('REGRESSION: an invented element symbol cannot balance', () => {
    const r = balanceEquation('Xx + O2 -> XxO2')
    assert.equal(r.isBalanced, false)
  })
})

describe('balanceEquation — charged species', () => {
  test('REGRESSION: ionic half-equations are refused, not silently misread', () => {
    // Previously returned isBalanced: true by reading Cr3+ as three chromium
    // atoms and dropping the charges entirely.
    const r = balanceEquation('Cr2O7^2- + H+ -> Cr3+ + H2O')
    assert.equal(r.isBalanced, false)
  })

  test('the molecular form of the same chemistry still works', () => {
    const r = balanceEquation('KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2')
    assert.equal(r.isBalanced, true)
  })
})

async function runTests() {
  console.log('🧪 Formula Parsing Tests\n')

  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log(`  ✓ ${testCase.name}`)
    } catch (error) {
      failures.push(testCase.name)
      console.log(`  ✗ ${testCase.name}`)
      console.error(error)
    }
  }

  console.log(`\n${passed} passed, ${failures.length} failed`)

  if (failures.length > 0) {
    failures.forEach((name) => console.log(`  - ${name}`))
    process.exitCode = 1
    return
  }

  console.log('\n✅ All formula-parsing tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
