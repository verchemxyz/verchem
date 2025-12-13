/**
 * VerChem Molecule Builder - Unit Tests
 * Testing chemistry logic for WCP standards
 */

// Lightweight test harness (no Jest/Vitest required)
import assert from 'node:assert/strict'

import {
  getValenceElectrons,
  calculateFormalCharge,
  checkOctetRule,
  getMolecularFormula,
  validateMolecule,
  recognizeMolecule,
  type BuilderAtom,
  type BuilderBond,
} from '@/lib/utils/molecule-builder'

import {
  getAllowedBondTypes,
  isBondTypeAllowed,
  getMaxBondOrder,
  getMaxTotalBondOrder,
} from '@/lib/utils/bond-restrictions'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

const tests: TestCase[] = []

function describe(_name: string, fn: () => void) {
  fn()
}

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected)
    },
    toBeNull() {
      assert.equal(actual, null)
    },
    toEqual(expected: unknown) {
      assert.deepEqual(actual, expected)
    },
    toContain(expected: unknown) {
      if (typeof actual === 'string') {
        assert.ok(actual.includes(String(expected)))
        return
      }
      if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected))
        return
      }
      throw new Error('toContain only supports string and array values')
    },
    toHaveLength(expected: number) {
      const length = (actual as { length?: unknown } | null | undefined)?.length
      assert.equal(typeof length, 'number')
      assert.equal(length, expected)
    },
    toBeGreaterThan(expected: number) {
      assert.equal(typeof actual, 'number')
      assert.ok((actual as number) > expected)
    },
  }
}

describe('Valence Electrons', () => {
  test('returns correct valence electrons for common elements', () => {
    expect(getValenceElectrons('H')).toBe(1)
    expect(getValenceElectrons('C')).toBe(4)
    expect(getValenceElectrons('N')).toBe(5)
    expect(getValenceElectrons('O')).toBe(6)
    expect(getValenceElectrons('F')).toBe(7)
    expect(getValenceElectrons('Cl')).toBe(7)
  })

  test('returns default value for unknown elements', () => {
    expect(getValenceElectrons('Xx')).toBe(4)
  })
})

describe('Formal Charge Calculation', () => {
  test('calculates formal charge correctly for neutral molecules', () => {
    // Water - H2O
    const oxygenAtom: BuilderAtom = {
      id: 1,
      element: 'O',
      x: 100,
      y: 100,
      z: 0,
      valenceElectrons: 6,
      formalCharge: 0,
    }

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 1, atom2Id: 2, order: 1 },
      { id: 2, atom1Id: 1, atom2Id: 3, order: 1 },
    ]

    expect(calculateFormalCharge(oxygenAtom, bonds)).toBe(0)
  })

  test('calculates formal charge for ions correctly', () => {
    // NH4+ (ammonium)
    const nitrogenAtom: BuilderAtom = {
      id: 1,
      element: 'N',
      x: 100,
      y: 100,
      z: 0,
      valenceElectrons: 5,
      formalCharge: 0,
    }

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 1, atom2Id: 2, order: 1 },
      { id: 2, atom1Id: 1, atom2Id: 3, order: 1 },
      { id: 3, atom1Id: 1, atom2Id: 4, order: 1 },
      { id: 4, atom1Id: 1, atom2Id: 5, order: 1 },
    ]

    expect(calculateFormalCharge(nitrogenAtom, bonds)).toBe(1)
  })
})

describe('Octet Rule Validation', () => {
  test('validates octet rule for stable molecules', () => {
    // Methane CH4
    const carbonAtom: BuilderAtom = {
      id: 1,
      element: 'C',
      x: 100,
      y: 100,
      z: 0,
      valenceElectrons: 4,
      formalCharge: 0,
    }

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 1, atom2Id: 2, order: 1 },
      { id: 2, atom1Id: 1, atom2Id: 3, order: 1 },
      { id: 3, atom1Id: 1, atom2Id: 4, order: 1 },
      { id: 4, atom1Id: 1, atom2Id: 5, order: 1 },
    ]

    const stability = checkOctetRule(carbonAtom, bonds)
    expect(stability.isStable).toBe(true)
    expect(stability.octetSatisfied).toBe(true)
    expect(stability.needsElectrons).toBe(0)
  })

  test('detects unstable atoms correctly', () => {
    // Methyl radical CH3 (7 electrons around carbon)
    const carbonAtom: BuilderAtom = {
      id: 1,
      element: 'C',
      x: 100,
      y: 100,
      z: 0,
      valenceElectrons: 4,
      formalCharge: 0,
    }

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 1, atom2Id: 2, order: 1 },
      { id: 2, atom1Id: 1, atom2Id: 3, order: 1 },
      { id: 3, atom1Id: 1, atom2Id: 4, order: 1 },
    ]

    const stability = checkOctetRule(carbonAtom, bonds)
    expect(stability.isStable).toBe(false)
    expect(stability.needsElectrons).toBe(1)
  })

  test('handles hydrogen duet rule', () => {
    const hydrogenAtom: BuilderAtom = {
      id: 1,
      element: 'H',
      x: 100,
      y: 100,
      z: 0,
      valenceElectrons: 1,
      formalCharge: 0,
    }

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 1, atom2Id: 2, order: 1 },
    ]

    const stability = checkOctetRule(hydrogenAtom, bonds)
    expect(stability.isStable).toBe(true)
    expect(stability.targetElectrons).toBe(2) // Duet rule
  })
})

describe('Molecular Formula Generation', () => {
  test('generates correct formula for simple molecules', () => {
    const atoms: BuilderAtom[] = [
      { id: 1, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 2, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 3, element: 'O', x: 0, y: 0, z: 0, valenceElectrons: 6, formalCharge: 0 },
    ]

    expect(getMolecularFormula(atoms)).toBe('H2O')
  })

  test('follows convention: C first, H second, then alphabetical', () => {
    const atoms: BuilderAtom[] = [
      { id: 1, element: 'O', x: 0, y: 0, z: 0, valenceElectrons: 6, formalCharge: 0 },
      { id: 2, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 3, element: 'C', x: 0, y: 0, z: 0, valenceElectrons: 4, formalCharge: 0 },
      { id: 4, element: 'N', x: 0, y: 0, z: 0, valenceElectrons: 5, formalCharge: 0 },
    ]

    expect(getMolecularFormula(atoms)).toBe('CHNO')
  })

  test('handles empty molecule', () => {
    expect(getMolecularFormula([])).toBe('Empty')
  })
})

describe('Molecule Recognition', () => {
  test('recognizes water correctly', () => {
    const atoms: BuilderAtom[] = [
      { id: 1, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 2, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 3, element: 'O', x: 0, y: 0, z: 0, valenceElectrons: 6, formalCharge: 0 },
    ]

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 3, atom2Id: 1, order: 1 },
      { id: 2, atom1Id: 3, atom2Id: 2, order: 1 },
    ]

    const result = recognizeMolecule(atoms, bonds)
    expect(result).toContain('Water')
  })

  test('recognizes methane correctly', () => {
    const atoms: BuilderAtom[] = [
      { id: 1, element: 'C', x: 0, y: 0, z: 0, valenceElectrons: 4, formalCharge: 0 },
      { id: 2, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 3, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 4, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 5, element: 'H', x: 0, y: 0, z: 0, valenceElectrons: 1, formalCharge: 0 },
    ]

    const bonds: BuilderBond[] = []

    const result = recognizeMolecule(atoms, bonds)
    expect(result).toContain('Methane')
  })

  test('returns null for unknown molecules', () => {
    const atoms: BuilderAtom[] = [
      { id: 1, element: 'Xe', x: 0, y: 0, z: 0, valenceElectrons: 8, formalCharge: 0 },
    ]

    const bonds: BuilderBond[] = []

    expect(recognizeMolecule(atoms, bonds)).toBeNull()
  })
})

describe('Bond Type Restrictions', () => {
  test('hydrogen can only form single bonds', () => {
    expect(getAllowedBondTypes('H')).toEqual(['single'])
    expect(isBondTypeAllowed('H', 'C', 'single')).toBe(true)
    expect(isBondTypeAllowed('H', 'C', 'double')).toBe(false)
    expect(isBondTypeAllowed('H', 'C', 'triple')).toBe(false)
  })

  test('carbon can form all bond types', () => {
    expect(getAllowedBondTypes('C')).toEqual(['single', 'double', 'triple'])
    expect(isBondTypeAllowed('C', 'C', 'single')).toBe(true)
    expect(isBondTypeAllowed('C', 'C', 'double')).toBe(true)
    expect(isBondTypeAllowed('C', 'C', 'triple')).toBe(true)
  })

  test('oxygen can form single and double bonds only', () => {
    expect(getAllowedBondTypes('O')).toEqual(['single', 'double'])
    expect(isBondTypeAllowed('O', 'C', 'single')).toBe(true)
    expect(isBondTypeAllowed('O', 'C', 'double')).toBe(true)
    expect(isBondTypeAllowed('O', 'N', 'triple')).toBe(false)
  })

  test('halogens can only form single bonds', () => {
    expect(getAllowedBondTypes('F')).toEqual(['single'])
    expect(getAllowedBondTypes('Cl')).toEqual(['single'])
    expect(getAllowedBondTypes('Br')).toEqual(['single'])
    expect(getAllowedBondTypes('I')).toEqual(['single'])
  })

  test('case insensitive element symbols', () => {
    expect(getAllowedBondTypes('cl')).toEqual(['single'])
    expect(getAllowedBondTypes('CL')).toEqual(['single'])
    expect(getAllowedBondTypes('Cl')).toEqual(['single'])
  })
})

describe('Max Bond Order', () => {
  test('calculates correct max bond order between atoms', () => {
    expect(getMaxBondOrder('C', 'C')).toBe(3) // Carbon-carbon triple bond
    expect(getMaxBondOrder('C', 'O')).toBe(2) // Carbon-oxygen double bond
    expect(getMaxBondOrder('H', 'C')).toBe(1) // Hydrogen-carbon single bond
    expect(getMaxBondOrder('N', 'N')).toBe(3) // Nitrogen-nitrogen triple bond
  })

  test('respects both atoms restrictions', () => {
    expect(getMaxBondOrder('H', 'N')).toBe(1) // Limited by hydrogen
    expect(getMaxBondOrder('F', 'C')).toBe(1) // Limited by fluorine
    expect(getMaxBondOrder('O', 'N')).toBe(2) // Limited by oxygen
  })
})

describe('Max Total Bond Order', () => {
  test('returns correct valence limits', () => {
    expect(getMaxTotalBondOrder('H')).toBe(1)  // Hydrogen: 1 bond
    expect(getMaxTotalBondOrder('O')).toBe(2)  // Oxygen: 2 bonds
    expect(getMaxTotalBondOrder('B')).toBe(3)  // Boron: 3 bonds
    expect(getMaxTotalBondOrder('C')).toBe(4)  // Carbon: 4 bonds
    expect(getMaxTotalBondOrder('N')).toBe(4)  // Nitrogen: up to 4
  })

  test('halogens limited to single bond', () => {
    expect(getMaxTotalBondOrder('F')).toBe(1)
    expect(getMaxTotalBondOrder('Cl')).toBe(1)
    expect(getMaxTotalBondOrder('Br')).toBe(1)
    expect(getMaxTotalBondOrder('I')).toBe(1)
  })
})

describe('Complete Molecule Validation', () => {
  test('validates stable water molecule', () => {
    const atoms: BuilderAtom[] = [
      { id: 1, element: 'O', x: 100, y: 100, z: 0, valenceElectrons: 6, formalCharge: 0 },
      { id: 2, element: 'H', x: 50, y: 150, z: 0, valenceElectrons: 1, formalCharge: 0 },
      { id: 3, element: 'H', x: 150, y: 150, z: 0, valenceElectrons: 1, formalCharge: 0 },
    ]

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 1, atom2Id: 2, order: 1 },
      { id: 2, atom1Id: 1, atom2Id: 3, order: 1 },
    ]

    const validation = validateMolecule(atoms, bonds)
    expect(validation.isStable).toBe(true)
    expect(validation.isValid).toBe(true)
    expect(validation.formula).toBe('H2O')
    expect(validation.totalCharge).toBe(0)
    expect(validation.warnings).toHaveLength(0)
  })

  test('detects unstable molecules', () => {
    const atoms: BuilderAtom[] = [
      { id: 1, element: 'C', x: 100, y: 100, z: 0, valenceElectrons: 4, formalCharge: 0 },
      { id: 2, element: 'H', x: 50, y: 150, z: 0, valenceElectrons: 1, formalCharge: 0 },
    ]

    const bonds: BuilderBond[] = [
      { id: 1, atom1Id: 1, atom2Id: 2, order: 1 },
    ]

    const validation = validateMolecule(atoms, bonds)
    expect(validation.isStable).toBe(false)
    expect(validation.hints.length).toBeGreaterThan(0)
    expect(validation.hints[0]).toContain('needs')
  })

  test('handles empty molecule', () => {
    const validation = validateMolecule([], [])
    expect(validation.isValid).toBe(false)
    expect(validation.formula).toBe('Empty')
  })
})

async function runTests() {
  console.log('🧪 VerChem Molecule Builder Unit Tests')
  console.log('====================================\n')

  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log(`✅ ${testCase.name}`)
    } catch (error) {
      failures.push(testCase.name)
      console.log(`❌ ${testCase.name}`)
      console.error(error)
    }
  }

  console.log('\n📊 Test Summary')
  console.log('--------------')
  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failures.length}`)

  if (failures.length > 0) {
    console.log('\n❌ Failures:')
    failures.forEach((name) => console.log(`  - ${name}`))
    process.exitCode = 1
    return
  }

  console.log('\n✅ All molecule builder tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
