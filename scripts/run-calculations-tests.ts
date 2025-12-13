#!/usr/bin/env tsx

// VerChem - Calculator Unit Test Runner
// Lightweight unit tests for core calculation modules (no Jest/Vitest needed)

import {
  calculateMolecularMass,
  massToMoles,
  molesToMass,
  molesToMolecules,
  moleculesToMoles,
  molesToVolumeSTP,
  volumeSTPToMoles,
  calculatePercentComposition,
  calculateEmpiricalFormula,
  findLimitingReagent,
  calculateTheoreticalYield,
  calculatePercentYield,
  calculateDilution as calculateStoichiometryDilution,
} from '../lib/calculations/stoichiometry'
import {
  celsiusToKelvin,
  kelvinToCelsius,
  atmToKPa,
  kPaToAtm,
  idealGasLaw,
  combinedGasLaw,
  boylesLaw,
  charlesLaw,
  gayLussacsLaw,
  avogadrosLaw,
  daltonsLaw,
  calculatePartialPressure,
  calculateMoleFraction,
  grahamsLaw,
  vanDerWaalsEquation,
  calculateGasDensity,
  calculateMolarMassFromDensity,
  calculateRMSVelocity,
  calculateAverageKineticEnergy,
} from '../lib/calculations/gas-laws'
import {
  calculateMolarity,
  calculateMolality,
  calculateMassPercent,
  calculatePPM,
  calculatePH,
  calculateH_Concentration,
  calculatePOH,
  calculateOH_Concentration,
  pHToPOH,
  pOHToPH,
  calculateStrongAcidPH,
  calculateStrongBasePH,
  calculateWeakAcidPH,
  calculateWeakBasePH,
  calculatePHFromPKa,
  hendersonHasselbalch,
  calculateBufferCapacity,
  calculateDilution as calculateSolutionDilution,
  calculateOsmoticPressure,
  WATER_KB,
  WATER_KF,
  calculateBoilingPointElevation,
  calculateFreezingPointDepression,
} from '../lib/calculations/solutions'
import {
  analyzeReaction,
  calculateDeltaG,
  calculateEquilibriumConstant,
  STANDARD_TEMPERATURE,
} from '../lib/calculations/thermodynamics'
import {
  calculateCellPotential,
  calculateNernstEquation,
  calculateElectrolysis,
  balanceRedoxEquation,
  getStandardPotential,
  EXAMPLE_CELLS,
} from '../lib/calculations/electrochemistry'
import {
  AVOGADRO_CONSTANT,
  FARADAY_CONSTANT,
  STP,
} from '../lib/constants/physical-constants'

type TestCase = {
  name: string
  fn: () => void | Promise<void>
}

const tests: TestCase[] = []

function test(name: string, fn: () => void | Promise<void>): void {
  tests.push({ name, fn })
}

function expectEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(expected)}, got ${String(actual)}`
    )
  }
}

function expectApproximately(
  actual: number,
  expected: number,
  tolerancePercent: number,
  message?: string
): void {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    throw new Error(
      message ?? `Expected finite numbers, got ${actual} and ${expected}`
    )
  }

  const denominator = Math.abs(expected) > 0 ? Math.abs(expected) : 1
  const errorPercent = (Math.abs(actual - expected) / denominator) * 100

  if (errorPercent > tolerancePercent) {
    throw new Error(
      message ??
        `Expected ~${expected}, got ${actual} (error ${errorPercent.toFixed(
          4
        )}% > ${tolerancePercent}%)`
    )
  }
}

function expectThrows(fn: () => unknown, messageIncludes?: string): void {
  let threw = false
  try {
    fn()
  } catch (error) {
    threw = true
    if (messageIncludes && error instanceof Error) {
      if (!error.message.includes(messageIncludes)) {
        throw new Error(
          `Expected error message to include "${messageIncludes}", got "${error.message}"`
        )
      }
    }
  }

  if (!threw) {
    throw new Error('Expected function to throw, but it did not')
  }
}

/**
 * Stoichiometry tests
 */
test('stoichiometry: molecular mass of water (H2O)', () => {
  const mass = calculateMolecularMass('H2O')
  expectApproximately(mass, 18.015, 0.5)
})

test('stoichiometry: molecular mass with parentheses (Ca(OH)2)', () => {
  const mass = calculateMolecularMass('Ca(OH)2')
  expectApproximately(mass, 74.092, 0.5)
})

test('stoichiometry: percent composition of H2O', () => {
  const composition = calculatePercentComposition('H2O')
  const percentH = composition.H
  const percentO = composition.O

  if (percentH === undefined || percentO === undefined) {
    throw new Error('Missing H or O in percent composition')
  }

  expectApproximately(percentH, 11.19, 0.5)
  expectApproximately(percentO, 88.81, 0.5)
  expectApproximately(percentH + percentO, 100, 0.01)
})

test('stoichiometry: empirical formula from glucose percent composition', () => {
  const composition = calculatePercentComposition('C6H12O6')
  const empirical = calculateEmpiricalFormula(composition)
  expectEqual(empirical, 'CH2O')
})

test('stoichiometry: mass ↔ moles conversions', () => {
  const molarMass = 18.015
  const mass = 36.03
  const moles = massToMoles(mass, molarMass)
  expectApproximately(moles, 2, 0.001)

  const massBack = molesToMass(moles, molarMass)
  expectApproximately(massBack, mass, 0.001)
})

test('stoichiometry: moles ↔ molecules conversions using Avogadro constant', () => {
  const moles = 2
  const molecules = molesToMolecules(moles)
  expectApproximately(molecules, moles * AVOGADRO_CONSTANT, 0.000001)

  const molesBack = moleculesToMoles(molecules)
  expectApproximately(molesBack, moles, 0.000001)
})

test('stoichiometry: moles ↔ volume at STP conversions', () => {
  const moles = 1
  const volume = molesToVolumeSTP(moles)
  expectApproximately(volume, STP.molarVolume, 0.000001)

  const molesBack = volumeSTPToMoles(volume)
  expectApproximately(molesBack, moles, 0.000001)
})

test('stoichiometry: limiting reagent for 2H2 + O2 -> 2H2O', () => {
  const result = findLimitingReagent(
    {
      reactants: [
        { formula: 'H2', moles: 1, coefficient: 2 },
        { formula: 'O2', moles: 1, coefficient: 1 },
      ],
    },
    [{ formula: 'H2O', coefficient: 2 }]
  )

  expectEqual(result.limitingReagent, 'H2')
  expectApproximately(result.molesProductFormed['H2O'], 1, 0.001)
})

test('stoichiometry: theoretical yield from limiting reagent', () => {
  const limitingMoles = 1
  const result = calculateTheoreticalYield(limitingMoles, 2, 2, 'H2O')

  expectApproximately(result.moles, 1, 0.001)
  expectApproximately(result.mass, calculateMolecularMass('H2O'), 0.5)
})

test('stoichiometry: percent yield basic case', () => {
  const percent = calculatePercentYield(40, 50)
  expectApproximately(percent, 80, 0.0001)
})

test('stoichiometry: dilution (solve for V2)', () => {
  const result = calculateStoichiometryDilution(1, 1, 0.5, undefined)
  expectApproximately(result.V2, 2, 0.0001)
})

test('stoichiometry: dilution throws on invalid parameters', () => {
  expectThrows(
    () => calculateStoichiometryDilution(undefined, 1, undefined, 1),
    'Invalid dilution parameters'
  )
})

/**
 * Gas laws tests
 */
test('gas-laws: Celsius ↔ Kelvin conversion', () => {
  const kelvin = celsiusToKelvin(25)
  expectApproximately(kelvin, 298.15, 0.0001)

  const celsius = kelvinToCelsius(kelvin)
  expectApproximately(celsius, 25, 0.0001)
})

test('gas-laws: atm ↔ kPa conversion', () => {
  const kPa = atmToKPa(1)
  expectApproximately(kPa, 101.325, 0.0001)

  const atm = kPaToAtm(kPa)
  expectApproximately(atm, 1, 0.0001)
})

test('gas-laws: ideal gas law at STP (N2)', () => {
  const result = idealGasLaw({
    n: 1,
    T: 273.15,
    P: 1,
  })

  expectApproximately(result.V, 22.414, 0.1)
})

test('gas-laws: ideal gas law throws when not exactly 3 parameters', () => {
  expectThrows(
    () => idealGasLaw({ n: 1 }),
    'Need exactly 3 of 4 parameters'
  )
})

test('gas-laws: combined gas law example', () => {
  const result = combinedGasLaw({
    P1: 2.0,
    V1: 5.0,
    T1: 300,
    P2: 1.0,
    T2: 400,
  })

  expectApproximately(result.V2, 13.3, 0.5)
})

test('gas-laws: combined gas law throws on insufficient known values', () => {
  expectThrows(
    () => combinedGasLaw({ P1: 1, V1: 1, T1: 300, P2: 1 }),
    'Need exactly 5 of 6 parameters'
  )
})

test('gas-laws: Boyle, Charles, Gay-Lussac, Avogadro laws basic behavior', () => {
  // Boyle's Law: P1V1 = P2V2
  const boyle = boylesLaw(1, 2, 2, undefined)
  expectApproximately(boyle.V2!, 1, 0.0001)

  // Charles's Law: V1/T1 = V2/T2
  const charles = charlesLaw(1, 300, undefined, 600)
  expectApproximately(charles.V2!, 2, 0.0001)

  // Gay-Lussac's Law: P1/T1 = P2/T2
  const gayLussac = gayLussacsLaw(1, 300, undefined, 600)
  expectApproximately(gayLussac.P2!, 2, 0.0001)

  // Avogadro's Law: V1/n1 = V2/n2
  const avogadro = avogadrosLaw(2, 1, undefined, 2)
  expectApproximately(avogadro.V2!, 4, 0.0001)
})

test('gas-laws: Dalton, partial pressure, mole fraction', () => {
  const total = daltonsLaw([0.5, 0.3, 0.2])
  expectApproximately(total, 1.0, 0.0001)

  const partial = calculatePartialPressure(1.0, 0.25)
  expectApproximately(partial, 0.25, 0.0001)

  const moleFraction = calculateMoleFraction(2, 8)
  expectApproximately(moleFraction, 0.25, 0.0001)
})

test('gas-laws: Graham\'s law calculates rate2 from rate1', () => {
  const rate2 = grahamsLaw(1, 4, 16)
  expectApproximately(rate2, 0.5, 0.0001)
})

test('gas-laws: van der Waals equation input validation', () => {
  expectThrows(
    () =>
      vanDerWaalsEquation({
        n: 0,
        V: 1,
        T: 300,
        a: 1,
        b: 0.1,
      }),
    'Number of moles must be positive'
  )

  expectThrows(
    () =>
      vanDerWaalsEquation({
        n: 1,
        V: 0.01,
        T: 300,
        a: 1,
        b: 0.02,
      }),
    'Volume (0.010'
  )
})

test('gas-laws: gas density ↔ molar mass from density', () => {
  const molarMass = 44 // CO2 approx
  const pressure = 1
  const temperature = 298.15

  const density = calculateGasDensity(molarMass, pressure, temperature)
  const back = calculateMolarMassFromDensity(density, pressure, temperature)

  expectApproximately(back, molarMass, 0.0001)
})

test('gas-laws: RMS velocity scales with sqrt(T)', () => {
  const molarMass = 28 // N2 approx
  const v1 = calculateRMSVelocity(molarMass, 300)
  const v2 = calculateRMSVelocity(molarMass, 600)

  const ratio = v2 / v1
  expectApproximately(ratio, Math.sqrt(2), 0.5)
})

test('gas-laws: average kinetic energy scales linearly with T', () => {
  const ke1 = calculateAverageKineticEnergy(300)
  const ke2 = calculateAverageKineticEnergy(600)

  const ratio = ke2 / ke1
  expectApproximately(ratio, 2, 0.01)
})

/**
 * Solution chemistry tests
 */
test('solutions: molarity from moles and volume', () => {
  const molarity = calculateMolarity(0.5, 0.25)
  expectApproximately(molarity, 2, 0.0001)
})

test('solutions: molarity from mass, molar mass, and volume', () => {
  const molarMassNaCl = 58.44
  const molarity = calculateMolarity(undefined, 0.5, 29.22, molarMassNaCl)
  expectApproximately(molarity, 1, 0.01)
})

test('solutions: molarity throws on insufficient parameters', () => {
  expectThrows(
    () => calculateMolarity(undefined, 1),
    'Insufficient parameters to calculate molarity'
  )
})

test('solutions: molality, mass percent, and ppm basics', () => {
  const molality = calculateMolality(1, 0.5)
  expectApproximately(molality, 2, 0.0001)

  const massPercent = calculateMassPercent(10, 200)
  expectApproximately(massPercent, 5, 0.0001)

  const ppm = calculatePPM(50, 1)
  expectApproximately(ppm, 50, 0.0001)
})

test('solutions: pH and [H+] conversions', () => {
  const pH = calculatePH(1e-3)
  expectApproximately(pH, 3, 0.0001)

  const H = calculateH_Concentration(pH)
  expectApproximately(H, 1e-3, 0.0001)
})

test('solutions: pH throws on non-positive [H+]', () => {
  expectThrows(
    () => calculatePH(0),
    'H+ concentration must be positive'
  )
})

test('solutions: pOH and [OH-] conversions', () => {
  const pOH = calculatePOH(1e-4)
  expectApproximately(pOH, 4, 0.0001)

  const OH = calculateOH_Concentration(pOH)
  expectApproximately(OH, 1e-4, 0.0001)
})

test('solutions: pOH throws on non-positive [OH-]', () => {
  expectThrows(
    () => calculatePOH(0),
    'OH- concentration must be positive'
  )
})

test('solutions: pH ↔ pOH relationships at 25°C', () => {
  const pH = 4
  const pOH = pHToPOH(pH)
  expectApproximately(pOH, 10, 0.0001)

  const pHBack = pOHToPH(pOH)
  expectApproximately(pHBack, pH, 0.0001)
})

test('solutions: strong acid and strong base pH', () => {
  const strongAcid = calculateStrongAcidPH(0.01)
  expectApproximately(strongAcid.pH, 2, 0.01)

  const strongBase = calculateStrongBasePH(0.01)
  expectApproximately(strongBase.pH, 12, 0.01)
})

test('solutions: weak acid pH (acetic acid ~0.1 M)', () => {
  const pKa = 4.76
  const concentration = 0.1
  const Ka = Math.pow(10, -pKa)

  const result = calculateWeakAcidPH(concentration, Ka)
  const expectedPH = (pKa - Math.log10(concentration)) / 2

  expectApproximately(result.pH, expectedPH, 0.1)
})

test('solutions: weak base pH (NH3 ~0.1 M)', () => {
  const concentration = 0.1
  const Kb = 1.8e-5

  const result = calculateWeakBasePH(concentration, Kb)

  expectApproximately(result.pH, 11.1, 1)
})

test('solutions: pH from pKa helper', () => {
  const pH = calculatePHFromPKa(0.1, 4.76)
  expectApproximately(pH, 2.9, 1)
})

test('solutions: Henderson-Hasselbalch buffer pH', () => {
  const pH = hendersonHasselbalch(4.76, 0.1, 0.1)
  expectApproximately(pH, 4.76, 0.01)
})

test('solutions: buffer capacity positive and finite', () => {
  const capacity = calculateBufferCapacity(0.1, 4.76, 4.76)
  if (!(capacity > 0 && Number.isFinite(capacity))) {
    throw new Error('Buffer capacity should be positive and finite')
  }
})

test('solutions: dilution calculator (M1V1 = M2V2)', () => {
  const result = calculateSolutionDilution({
    M1: 1,
    V1: 1,
    M2: 0.5,
  })

  expectApproximately(result.V2, 2, 0.0001)
  expectApproximately(result.volumeToAdd, 1, 0.0001)
})

test('solutions: dilution calculator throws when not exactly 3 parameters', () => {
  expectThrows(
    () => calculateSolutionDilution({ M1: 1, V1: 1 }),
    'Need exactly 3 of 4 parameters (M1, V1, M2, V2)'
  )
})

test('solutions: osmotic pressure scales with molarity and temperature', () => {
  const pi1 = calculateOsmoticPressure(0.1, 298.15)
  const pi2 = calculateOsmoticPressure(0.2, 298.15)
  const pi3 = calculateOsmoticPressure(0.1, 2 * 298.15)

  expectApproximately(pi2 / pi1, 2, 0.01)
  expectApproximately(pi3 / pi1, 2, 0.01)
})

test('solutions: boiling point elevation and freezing point depression', () => {
  const deltaTb = calculateBoilingPointElevation(1, WATER_KB, 2)
  const deltaTf = calculateFreezingPointDepression(1, WATER_KF, 2)

  expectApproximately(deltaTb, 2 * WATER_KB, 0.0001)
  expectApproximately(deltaTf, 2 * WATER_KF, 0.0001)
})

/**
 * Thermodynamics tests
 */
test('thermodynamics: combustion of methane is exothermic and spontaneous', () => {
  const example = analyzeReaction(
    [
      { formula: 'CO2', coefficient: 1 },
      { formula: 'H2O(g)', coefficient: 2 },
    ],
    [
      { formula: 'CH4', coefficient: 1 },
      { formula: 'O2', coefficient: 2 },
    ],
    STANDARD_TEMPERATURE
  )

  if (!example) {
    throw new Error('Thermodynamic analysis returned null')
  }

  if (!(example.deltaH < 0)) {
    throw new Error('Combustion of methane should be exothermic (ΔH < 0)')
  }
  if (!example.spontaneous) {
    throw new Error('Combustion of methane should be spontaneous at 298 K')
  }
  if (!(example.K && example.K > 1)) {
    throw new Error('Equilibrium constant for combustion should be > 1')
  }
})

test('thermodynamics: ΔG = 0 when ΔH = TΔS', () => {
  const temperature = STANDARD_TEMPERATURE
  const deltaS = 100 // J/(mol·K)
  const deltaH = (temperature * deltaS) / 1000 // kJ/mol

  const result = calculateDeltaG(deltaH, deltaS, temperature)
  expectApproximately(result.deltaG, 0, 0.001)
})

test('thermodynamics: equilibrium constant K ~ 1 when ΔG ≈ 0', () => {
  const result = calculateEquilibriumConstant(0, STANDARD_TEMPERATURE)
  expectApproximately(result.K, 1, 1)
})

/**
 * Electrochemistry tests
 */
test('electrochemistry: standard cell potential for Ag+/Ag || Zn2+/Zn', () => {
  const cathode = 0.7996
  const anode = -0.7618

  const result = calculateCellPotential(cathode, anode, 2)
  expectApproximately(result.cellPotential, 1.5614, 0.1)
  if (!result.spontaneous) {
    throw new Error('Cell with positive E° should be spontaneous')
  }
  if (!(result.deltaG < 0)) {
    throw new Error('ΔG should be negative for spontaneous cell')
  }
})

test('electrochemistry: non-spontaneous cell has negative E°', () => {
  const cathode = -0.76
  const anode = 0.34

  const result = calculateCellPotential(cathode, anode, 2)
  if (!(result.cellPotential < 0)) {
    throw new Error('Cell potential should be negative for this configuration')
  }
  if (result.spontaneous) {
    throw new Error('Cell with negative E° should not be spontaneous')
  }
})

test('electrochemistry: Nernst equation returns E = E0 when Q = 1', () => {
  const E0 = 1.10
  const n = 2
  const Q = 1

  const result = calculateNernstEquation(E0, n, Q, 298.15)
  expectApproximately(result.E, E0, 0.01)
})

test('electrochemistry: Nernst equation decreases E when Q > 1', () => {
  const E0 = 1.10
  const n = 2
  const Q = 10

  const result = calculateNernstEquation(E0, n, Q, 298.15)
  if (!(result.E < E0)) {
    throw new Error('Cell potential should decrease when Q > 1')
  }
})

test('electrochemistry: electrolysis with one mole of electrons and 1 g/mol', () => {
  const current = 1
  const time = FARADAY_CONSTANT
  const n = 1
  const molarMass = 1

  const result = calculateElectrolysis(current, time, n, molarMass, false)
  expectApproximately(result.moles, 1, 0.0001)
  expectApproximately(result.mass, 1, 0.0001)
})

test('electrochemistry: standard potentials lookup', () => {
  const EAg = getStandardPotential('Ag+/Ag')
  if (EAg === null) {
    throw new Error('Expected standard potential for Ag+/Ag')
  }
  expectApproximately(EAg, 0.8, 0.1)
})

test('electrochemistry: redox balancing for Daniell cell example', () => {
  const daniell = EXAMPLE_CELLS.find(cell => cell.name === 'Daniell Cell')
  if (!daniell) {
    throw new Error('Daniell Cell example not found')
  }

  const result = balanceRedoxEquation(daniell.anode, daniell.cathode, {
    acidic: true,
  })

  if (!(result.electronCount > 0)) {
    throw new Error('Balanced redox equation should transfer electrons')
  }

  if (!result.balanced.includes('Zn') || !result.balanced.includes('Cu')) {
    throw new Error(
      'Balanced equation should contain both Zn and Cu species'
    )
  }
})

async function runAllTests(): Promise<void> {
  console.log('🧪 VerChem Calculator Unit Tests')
  console.log('================================\n')

  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed += 1
      console.log(`✅ ${testCase.name}`)
    } catch (error) {
      failures.push(testCase.name)
      console.error(
        `❌ ${testCase.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  console.log('\n📊 Test Summary')
  console.log('--------------')
  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failures.length}`)

  if (failures.length > 0) {
    console.log('\n❌ Failures:')
    failures.forEach(name => console.log(`  - ${name}`))
    process.exitCode = 1
  } else {
    console.log('\n✅ All calculator unit tests passed!')
  }
}

runAllTests().catch(error => {
  console.error('Unexpected error while running tests:', error)
  process.exitCode = 1
})
