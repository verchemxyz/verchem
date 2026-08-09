/**
 * Compound database integrity invariants.
 *
 * Run: node --import tsx __tests__/compound-integrity.test.ts
 */

import assert from 'node:assert/strict'

import {
  COMPOUND_GROUPS,
  COMPOUND_STATISTICS,
  COMPREHENSIVE_COMPOUNDS,
  findCompoundById,
} from '@/lib/data/compounds'
import { COMPOUND_COLLISION_RESOLUTIONS } from '@/lib/data/compounds/curation'
import { hasApplicableMolarMass } from '@/lib/data/compounds/types'
import { parseFormula } from '@/lib/data/compounds/utils'
import { GHS_PICTOGRAMS, H_STATEMENTS } from '@/lib/data/lab-safety'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'
import { searchCompoundsAdvanced } from '@/lib/compound-search'
import { exportCompoundData, getCompoundForStoichiometry } from '@/lib/compound-integration'
import { serializeCsv } from '@/lib/csv'

type TestCase = { name: string; fn: () => void }
const tests: TestCase[] = []

function test(name: string, fn: () => void): void {
  tests.push({ name, fn })
}

function isValidCasNumber(value: string): boolean {
  const match = /^(\d{2,7})-(\d{2})-(\d)$/.exec(value)
  if (!match) return false

  const digits = `${match[1]}${match[2]}`
  let weightedSum = 0
  let weight = 1
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    weightedSum += Number(digits[index]) * weight
    weight += 1
  }
  return weightedSum % 10 === Number(match[3])
}

const atomicMassBySymbol = new Map(PERIODIC_TABLE.map(element => [element.symbol, element.atomicMass]))

function formulaMass(formula: string): number | undefined {
  const composition = parseFormula(formula)
  if (!composition) return undefined

  let mass = 0
  for (const [symbol, count] of Object.entries(composition)) {
    const atomicMass = atomicMassBySymbol.get(symbol)
    if (atomicMass === undefined) return undefined
    mass += atomicMass * count
  }
  return Math.round(mass * 1000) / 1000
}

test('public compound ids are case-insensitively unique', () => {
  const seen = new Map<string, string>()
  const duplicates: string[] = []

  for (const compound of COMPREHENSIVE_COMPOUNDS) {
    const normalizedId = compound.id.toLocaleLowerCase('en')
    const existing = seen.get(normalizedId)
    if (existing) duplicates.push(`${existing} / ${compound.id}`)
    seen.set(normalizedId, compound.id)
  }

  assert.deepEqual(duplicates, [], `duplicate ids: ${duplicates.join(', ')}`)
  assert.equal(COMPREHENSIVE_COMPOUNDS.length, 1311)
  assert.equal(COMPOUND_STATISTICS.totalCompounds, 1311)
})

test('all 120 audited collisions have an explicit resolution', () => {
  const resolutions = Object.values(COMPOUND_COLLISION_RESOLUTIONS)
  assert.equal(resolutions.length, 120)
  assert.equal(resolutions.filter(resolution => resolution.case === 'A').length, 118)
  assert.equal(resolutions.filter(resolution => resolution.case === 'B').length, 2)
})

test('canonical groups contain the same unique records as the public dataset', () => {
  const groupedCompounds = Object.values(COMPOUND_GROUPS).flat()
  assert.equal(groupedCompounds.length, COMPREHENSIVE_COMPOUNDS.length)
  assert.deepEqual(
    new Set(groupedCompounds.map(compound => compound.id)),
    new Set(COMPREHENSIVE_COMPOUNDS.map(compound => compound.id))
  )
})

test('formula and repeat-unit molar masses use project IUPAC 2021 atomic weights', () => {
  for (const compound of COMPREHENSIVE_COMPOUNDS) {
    if (compound.molarMassBasis === 'formula' || compound.molarMassBasis === 'repeat-unit') {
      assert.ok(hasApplicableMolarMass(compound), `${compound.id}: fixed formula needs an applicable molar mass`)
      if (!hasApplicableMolarMass(compound)) continue
      const expected = formulaMass(compound.formula)
      assert.notEqual(expected, undefined, `${compound.id}: formula should be parseable (${compound.formula})`)
      assert.ok(
        Math.abs(compound.molarMass - (expected ?? 0)) <= 0.001,
        `${compound.id}: ${compound.molarMass} g/mol does not match ${compound.formula} (${expected} g/mol)`
      )
      assert.ok(compound.molarMass > 0, `${compound.id}: fixed formula must have positive molar mass`)
      continue
    }

    if (compound.molarMassBasis === 'mixture-average') {
      assert.ok(hasApplicableMolarMass(compound), `${compound.id}: reviewed mixture average needs an applicable mass`)
      if (!hasApplicableMolarMass(compound)) continue
      assert.ok(Number.isFinite(compound.molarMass) && compound.molarMass > 0)
      assert.equal(compound.id, 'r-410a', `${compound.id}: unreviewed mixture-average mass`)
      continue
    }

    assert.equal(compound.molarMassBasis, 'not-applicable', `${compound.id}: missing molar-mass basis`)
    assert.equal(compound.molarMass, null, `${compound.id}: variable composition must not claim one molar mass`)
    assert.equal(hasApplicableMolarMass(compound), false, `${compound.id}: N/A mass passed the consumer gate`)
  }
})

test('formula parser preserves reviewed hydrate, nested, decimal and repeat-unit compositions', () => {
  assert.deepEqual(parseFormula('KAl(SO4)2·12H2O'), { K: 1, Al: 1, S: 2, O: 20, H: 24 })
  assert.deepEqual(parseFormula('Fe4[Fe(CN)6]3'), { Fe: 7, C: 18, N: 18 })
  assert.deepEqual(parseFormula('Li1.3Al0.3Ti1.7(PO4)3'), {
    Li: 1.3,
    Al: 0.3,
    Ti: 1.7,
    P: 3,
    O: 12,
  })
  assert.deepEqual(parseFormula('(C12H22N2O2)n'), { C: 12, H: 22, N: 2, O: 2 })
  assert.equal(parseFormula('C12H25(OCH2CH2)nOSO3Na'), null)
  assert.equal(parseFormula('CH2F2/C2HF5'), null)
})

test('legacy molecularMass is always identical to canonical molarMass', () => {
  for (const compound of COMPREHENSIVE_COMPOUNDS) {
    assert.equal(compound.molecularMass, compound.molarMass, compound.id)
  }
})

test('every retained CAS Registry Number has valid syntax and check digit', () => {
  for (const compound of COMPREHENSIVE_COMPOUNDS) {
    if (compound.casNumber) {
      assert.ok(isValidCasNumber(compound.casNumber), `${compound.id}: invalid CAS RN ${compound.casNumber}`)
      assert.equal(compound.cas, compound.casNumber, `${compound.id}: legacy CAS alias differs`)
    } else {
      assert.equal(compound.cas, undefined, `${compound.id}: orphan legacy CAS alias ${compound.cas}`)
    }

    for (const componentCasNumber of compound.componentCasNumbers ?? []) {
      assert.ok(
        isValidCasNumber(componentCasNumber),
        `${compound.id}: invalid component CAS RN ${componentCasNumber}`
      )
    }
  }
})

test('every GHS pictogram and H-statement code exists in lab-safety data', () => {
  const pictogramCodes = new Set(GHS_PICTOGRAMS.map(pictogram => pictogram.code))
  const hStatementCodes = new Set(H_STATEMENTS.map(statement => statement.code))

  for (const compound of COMPREHENSIVE_COMPOUNDS) {
    for (const code of compound.ghs ?? []) {
      assert.ok(pictogramCodes.has(code), `${compound.id}: unknown GHS pictogram ${code}`)
    }

    for (const hazard of compound.hazards ?? []) {
      const text = typeof hazard === 'string' ? hazard : hazard.ghsCode ?? ''
      for (const code of text.match(/\bH\d{3}\b/g) ?? []) {
        assert.ok(hStatementCodes.has(code), `${compound.id}: unknown H-statement ${code}`)
      }
      for (const code of text.match(/\bGHS\d{2}\b/g) ?? []) {
        assert.ok(pictogramCodes.has(code), `${compound.id}: unknown GHS pictogram ${code}`)
      }
    }
  }
})

test('state-specific GHS hazards are semantically compatible across the full dataset', () => {
  const allowedStateByCode = new Map<string, 'gas' | 'liquid' | 'solid'>([
    ['H220', 'gas'],
    ['H221', 'gas'],
    ['H230', 'gas'],
    ['H231', 'gas'],
    ['H280', 'gas'],
    ['H281', 'gas'],
    ['H224', 'liquid'],
    ['H225', 'liquid'],
    ['H226', 'liquid'],
    ['H228', 'solid'],
  ])

  for (const compound of COMPREHENSIVE_COMPOUNDS) {
    for (const hazard of compound.hazards ?? []) {
      const text = typeof hazard === 'string' ? hazard : hazard.ghsCode ?? ''
      for (const code of text.match(/\bH\d{3}\b/g) ?? []) {
        const requiredState = allowedStateByCode.get(code)
        if (requiredState) {
          assert.equal(
            compound.physicalState,
            requiredState,
            `${compound.id}: ${code} applies to ${requiredState}, not ${compound.physicalState}`
          )
        }
      }
    }
    if (compound.ghs?.includes('GHS04')) {
      assert.equal(compound.physicalState, 'gas', `${compound.id}: GHS04 requires a gas-state record`)
    }
  }

  assert.ok(findCompoundById('methane')?.hazards?.includes('H220'), 'methane should retain reviewed H220')
  assert.equal(findCompoundById('octane')?.hazards?.includes('H220') ?? false, false, 'liquid octane must not carry H220')
})

test('not-applicable molar masses stay out of numerical consumers and formula calculators', () => {
  assert.equal(
    COMPREHENSIVE_COMPOUNDS.filter(compound => compound.molarMassBasis === 'not-applicable').length,
    113
  )
  const petroleumEther = findCompoundById('petroleum-ether')
  assert.ok(petroleumEther)
  assert.equal(petroleumEther?.molarMassBasis, 'not-applicable')
  assert.equal(petroleumEther?.molarMass, null)
  assert.equal(getCompoundForStoichiometry(petroleumEther?.formula ?? ''), null)
  assert.equal(getCompoundForStoichiometry('CH2F2/C2HF5'), null, 'mixture average is not one molecular formula')

  const massFiltered = searchCompoundsAdvanced({ molecularMassRange: [0, 10_000] })
  assert.ok(massFiltered.length > 0)
  assert.ok(massFiltered.every(hasApplicableMolarMass))
})

test('compound CSV export follows RFC 4180 for commas, quotes and newlines', () => {
  assert.equal(
    serializeCsv([
      ['Name', 'Notes'],
      ['Nylon 6,6 (PA66)', 'line 1\r\n"quoted", line 2'],
    ]),
    'Name,Notes\r\n"Nylon 6,6 (PA66)","line 1\r\n""quoted"", line 2"'
  )

  const nylon = findCompoundById('nylon-66')
  assert.ok(nylon)
  assert.match(exportCompoundData('csv', nylon ? [nylon] : []), /"Nylon 6,6 \(PA66\)"/)
})

test('merged list fields contain no case-only duplicates', () => {
  for (const compound of COMPREHENSIVE_COMPOUNDS) {
    for (const [field, values] of [
      ['uses', compound.uses],
      ['ghs', compound.ghs],
      ['componentCasNumbers', compound.componentCasNumbers],
    ] as const) {
      const normalized = (values ?? []).map(value => value.trim().toLocaleLowerCase('en'))
      assert.equal(new Set(normalized).size, normalized.length, `${compound.id}: duplicate ${field}`)
    }
  }
})

test('CAS-distinct identities remain separately addressable', () => {
  assert.equal(findCompoundById('potassium-alum')?.casNumber, '7784-24-9')
  assert.equal(findCompoundById('potassium-alum')?.formula, 'KAl(SO4)2·12H2O')
  assert.equal(findCompoundById('potassium-aluminum-sulfate-anhydrous')?.casNumber, '10043-67-1')
  assert.equal(findCompoundById('tocopherol')?.casNumber, '59-02-9')
  assert.equal(findCompoundById('dl-alpha-tocopherol')?.casNumber, '10191-41-0')
})

function runTests(): void {
  console.log('Compound Integrity Tests\n')
  let failures = 0

  for (const testCase of tests) {
    try {
      testCase.fn()
      console.log(`  ✓ ${testCase.name}`)
    } catch (error) {
      failures += 1
      console.error(`  ✗ ${testCase.name}`)
      console.error(error)
    }
  }

  console.log(`\n${tests.length - failures} passed, ${failures} failed`)
  if (failures > 0) process.exitCode = 1
}

runTests()
