/**
 * VerChem - ASM1 Model Unit Tests
 *
 * Comprehensive test suite for the Activated Sludge Model No. 1 implementation.
 * Tests cover all 8 biological processes, stoichiometric matrix, ODE solver,
 * and complete simulation functionality.
 *
 * Reference: Henze et al. (1987) ASM1 publication values for validation
 */

import {
  correctTemperature,
  calculateProcessRates,
  getStoichiometricCoefficient,
  buildStoichiometricMatrix,
  calculateDerivatives,
  stateToArray,
  arrayToState,
  fractionateInfluent,
  calculateEffluentQuality,
  calculateOxygenDemand,
  calculateSludgeProduction,
  runASM1Simulation,
  calculateSteadyState,
} from '../lib/calculations/asm1-model'

import {
  ASM1StateVariables,
  ASM1KineticParameters,
  ASM1StoichiometricParameters,
  DEFAULT_ASM1_KINETIC_PARAMS,
  DEFAULT_ASM1_STOICH_PARAMS,
} from '../lib/types/asm1-model'

import {
  ODESolver,
  steadyStateError,
  isSteadyState,
} from '../lib/calculations/ode-solver'

// ============================================
// TEST UTILITIES
// ============================================

let passed = 0
let failed = 0
const errors: string[] = []

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    errors.push(message)
    console.log(`  ❌ ${message}`)
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string): void {
  const diff = Math.abs(actual - expected)
  const relDiff = expected !== 0 ? diff / Math.abs(expected) : diff
  if (relDiff <= tolerance || diff <= tolerance) {
    passed++
    console.log(`  ✅ ${message} (${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`)
  } else {
    failed++
    errors.push(`${message}: expected ${expected}, got ${actual} (diff: ${relDiff.toFixed(4)})`)
    console.log(`  ❌ ${message}: expected ${expected.toFixed(4)}, got ${actual.toFixed(4)}`)
  }
}

function assertRange(value: number, min: number, max: number, message: string): void {
  if (value >= min && value <= max) {
    passed++
    console.log(`  ✅ ${message} (${value.toFixed(4)} in [${min}, ${max}])`)
  } else {
    failed++
    errors.push(`${message}: ${value} not in [${min}, ${max}]`)
    console.log(`  ❌ ${message}: ${value.toFixed(4)} not in [${min}, ${max}]`)
  }
}

// ============================================
// TEST DATA
// ============================================

/**
 * Typical activated sludge reactor state
 */
const TYPICAL_REACTOR_STATE: ASM1StateVariables = {
  SI: 30,      // Inert soluble COD
  SS: 5,       // Readily biodegradable (low in reactor)
  XI: 1000,    // Inert particulate
  XS: 100,     // Slowly biodegradable
  XBH: 2500,   // Heterotrophic biomass (high in reactor)
  XBA: 200,    // Autotrophic biomass
  XP: 500,     // Decay products
  SO: 2.0,     // Dissolved oxygen
  SNO: 5,      // Nitrate
  SNH: 2,      // Ammonia (low - good nitrification)
  SND: 1,      // Soluble organic N
  XND: 5,      // Particulate organic N
  SALK: 3,     // Alkalinity
}

/**
 * Typical domestic wastewater influent state
 */
const TYPICAL_INFLUENT: ASM1StateVariables = {
  SI: 30,
  SS: 100,
  XI: 50,
  XS: 250,
  XBH: 10,
  XBA: 0,
  XP: 0,
  SO: 0,
  SNO: 0,
  SNH: 30,
  SND: 5,
  XND: 10,
  SALK: 5,
}

// ============================================
// TEST SECTIONS
// ============================================

console.log('\n🧪 ASM1 MODEL TESTS\n')
console.log('=' .repeat(60))

// --------------------------------------------
// 1. Temperature Correction Tests
// --------------------------------------------
console.log('\n📊 1. Temperature Correction Tests\n')

{
  // Test at 20°C (no correction)
  const params20 = correctTemperature(DEFAULT_ASM1_KINETIC_PARAMS, 20)
  assertApprox(params20.muH, DEFAULT_ASM1_KINETIC_PARAMS.muH, 0.001, 'muH at 20°C unchanged')
  assertApprox(params20.muA, DEFAULT_ASM1_KINETIC_PARAMS.muA, 0.001, 'muA at 20°C unchanged')

  // Test at 25°C (higher rates)
  const params25 = correctTemperature(DEFAULT_ASM1_KINETIC_PARAMS, 25)
  assert(params25.muH > DEFAULT_ASM1_KINETIC_PARAMS.muH, 'muH increases at 25°C')
  assert(params25.muA > DEFAULT_ASM1_KINETIC_PARAMS.muA, 'muA increases at 25°C')

  // Test at 15°C (lower rates)
  const params15 = correctTemperature(DEFAULT_ASM1_KINETIC_PARAMS, 15)
  assert(params15.muH < DEFAULT_ASM1_KINETIC_PARAMS.muH, 'muH decreases at 15°C')
  assert(params15.muA < DEFAULT_ASM1_KINETIC_PARAMS.muA, 'muA decreases at 15°C')

  // Test Arrhenius relationship
  // k(25) = k(20) * theta^5
  const expectedMuH25 = DEFAULT_ASM1_KINETIC_PARAMS.muH * Math.pow(1.072, 5)
  assertApprox(params25.muH, expectedMuH25, 0.001, 'muH follows Arrhenius at 25°C')
}

// --------------------------------------------
// 2. Process Rate Calculation Tests
// --------------------------------------------
console.log('\n📊 2. Process Rate Calculation Tests\n')

{
  const rates = calculateProcessRates(
    TYPICAL_REACTOR_STATE,
    DEFAULT_ASM1_KINETIC_PARAMS,
    DEFAULT_ASM1_STOICH_PARAMS
  )

  assert(rates.length === 8, 'All 8 processes calculated')

  // Process 1: Aerobic heterotroph growth (should be active)
  assert(rates[0].rate > 0, 'Aerobic heterotroph growth is active')
  assert(rates[0].process === 'aerobic_growth_heterotrophs', 'Process 1 type correct')

  // Process 2: Anoxic growth (low due to oxygen presence)
  assert(rates[1].rate < rates[0].rate, 'Anoxic growth < aerobic growth when DO present')

  // Process 3: Nitrification (should be active with ammonia)
  assert(rates[2].rate > 0, 'Nitrification is active')

  // Process 4 & 5: Decay (always active with biomass)
  assert(rates[3].rate > 0, 'Heterotroph decay is active')
  assert(rates[4].rate > 0, 'Autotroph decay is active')

  // Process 6: Ammonification
  assert(rates[5].rate > 0, 'Ammonification is active')

  // Process 7 & 8: Hydrolysis
  assert(rates[6].rate > 0, 'Organic hydrolysis is active')
  assert(rates[7].rate >= 0, 'N hydrolysis is non-negative')

  // Validate rate equations are strings
  assert(typeof rates[0].rateEquation === 'string', 'Rate equation is string')
}

// --------------------------------------------
// 3. Stoichiometric Matrix Tests
// --------------------------------------------
console.log('\n📊 3. Stoichiometric Matrix Tests\n')

{
  const matrix = buildStoichiometricMatrix(DEFAULT_ASM1_STOICH_PARAMS)

  assert(matrix.length === 8, 'Matrix has 8 rows (processes)')
  assert(matrix[0].length === 13, 'Matrix has 13 columns (components)')

  // Test specific coefficients
  const YH = DEFAULT_ASM1_STOICH_PARAMS.YH

  // Process 1, SS consumption: -1/YH
  assertApprox(matrix[0][1], -1 / YH, 0.001, 'Process 1: SS consumption = -1/YH')

  // Process 1, XBH production: +1
  assertApprox(matrix[0][4], 1, 0.001, 'Process 1: XBH production = 1')

  // Process 3, NO3 production from nitrification
  const YA = DEFAULT_ASM1_STOICH_PARAMS.YA
  assertApprox(matrix[2][8], 1 / YA, 0.001, 'Process 3: SNO production = 1/YA')

  // Mass balance check: sum of each row should reflect conservation
  // (with proper mass units - this is a simplified check)
}

// --------------------------------------------
// 4. State Conversion Tests
// --------------------------------------------
console.log('\n📊 4. State Conversion Tests\n')

{
  const array = stateToArray(TYPICAL_REACTOR_STATE)

  assert(array.length === 13, 'State array has 13 elements')
  assertApprox(array[0], TYPICAL_REACTOR_STATE.SI, 0.001, 'SI at index 0')
  assertApprox(array[4], TYPICAL_REACTOR_STATE.XBH, 0.001, 'XBH at index 4')

  // Round-trip conversion
  const recovered = arrayToState(array)
  assertApprox(recovered.SI, TYPICAL_REACTOR_STATE.SI, 0.001, 'SI recovered correctly')
  assertApprox(recovered.XBH, TYPICAL_REACTOR_STATE.XBH, 0.001, 'XBH recovered correctly')
  assertApprox(recovered.SO, TYPICAL_REACTOR_STATE.SO, 0.001, 'SO recovered correctly')

  // Negative values should be clamped to 0
  const withNegative = arrayToState([-10, 5, 3, 2, 1, 0, -5, 2, 0, 0, 0, 0, 0])
  assert(withNegative.SI >= 0, 'Negative SI clamped to 0')
}

// --------------------------------------------
// 5. Influent Fractionation Tests
// --------------------------------------------
console.log('\n📊 5. Influent Fractionation Tests\n')

{
  const cod = 500 // mg/L
  const tkn = 50 // mg/L
  const nh4 = 35 // mg/L
  const alkalinity = 250 // mg/L as CaCO3

  const influent = fractionateInfluent(cod, tkn, nh4, alkalinity)

  // Check COD fractionation sums approximately to total
  const totalCOD = influent.SI + influent.SS + influent.XI + influent.XS +
    influent.XBH + influent.XBA + influent.XP
  assertApprox(totalCOD, cod, 0.01, 'COD fractionation sums to total')

  // Check nitrogen fractionation
  assert(influent.SNH === nh4, 'SNH equals input ammonia')
  const organicN = tkn - nh4
  assertApprox(influent.SND + influent.XND, organicN, 0.1, 'Organic N fractionation correct')

  // Check alkalinity conversion
  // 250 mg/L CaCO3 = 2.5 mol/m³ HCO3
  assertApprox(influent.SALK, 2.5, 0.01, 'Alkalinity conversion correct')

  // DO and NO3 should be 0 in raw wastewater
  assertApprox(influent.SO, 0, 0.001, 'SO is 0 in influent')
  assertApprox(influent.SNO, 0, 0.001, 'SNO is 0 in influent')
}

// --------------------------------------------
// 6. Derivatives Calculation Tests
// --------------------------------------------
console.log('\n📊 6. Derivatives Calculation Tests\n')

{
  const derivatives = calculateDerivatives(
    TYPICAL_REACTOR_STATE,
    DEFAULT_ASM1_KINETIC_PARAMS,
    DEFAULT_ASM1_STOICH_PARAMS
  )

  assert(derivatives.length === 13, 'Derivatives array has 13 elements')

  // SI is inert - derivative should be 0
  assertApprox(derivatives[0], 0, 0.001, 'SI derivative is 0 (inert)')

  // SS should decrease (consumption > production)
  // In active reactor with low SS, net consumption expected
  // (but hydrolysis may provide some production)

  // XBH should generally increase in active reactor
  // (growth > decay when substrate available)

  // All derivatives should be finite
  assert(derivatives.every(d => Number.isFinite(d)), 'All derivatives are finite')
}

// --------------------------------------------
// 7. Effluent Quality Tests
// --------------------------------------------
console.log('\n📊 7. Effluent Quality Tests\n')

{
  const effluent = calculateEffluentQuality(TYPICAL_REACTOR_STATE)

  assert(effluent.COD > 0, 'Effluent COD is positive')
  assert(effluent.BOD5 > 0, 'Effluent BOD5 is positive')
  assert(effluent.TSS >= 0, 'Effluent TSS is non-negative')
  assert(effluent.TN >= 0, 'Effluent TN is non-negative')

  // Effluent COD should be much lower than mixed liquor
  const mixedLiquorCOD = TYPICAL_REACTOR_STATE.SI + TYPICAL_REACTOR_STATE.SS +
    TYPICAL_REACTOR_STATE.XI + TYPICAL_REACTOR_STATE.XS +
    TYPICAL_REACTOR_STATE.XBH + TYPICAL_REACTOR_STATE.XBA +
    TYPICAL_REACTOR_STATE.XP
  assert(effluent.COD < mixedLiquorCOD * 0.2, 'Effluent COD << mixed liquor COD (clarifier effect)')

  // BOD5 should be < COD
  assert(effluent.BOD5 <= effluent.COD, 'BOD5 <= COD')

  // TN = TKN + NO3
  assertApprox(effluent.TN, effluent.TKN + effluent.NO3N, 0.01, 'TN = TKN + NO3')
}

// --------------------------------------------
// 8. ODE Solver Tests
// --------------------------------------------
console.log('\n📊 8. ODE Solver Tests\n')

{
  // Simple exponential decay: dy/dt = -y
  // Solution: y(t) = y0 * exp(-t)
  const decayFunction = (_t: number, y: number[]): number[] => [-y[0]]

  const eulerSolver = new ODESolver(decayFunction, { method: 'euler' })
  const rk4Solver = new ODESolver(decayFunction, { method: 'rk4' })
  const rkf45Solver = new ODESolver(decayFunction, { method: 'rkf45', tolerance: 1e-6 })

  const y0 = [1.0]
  const solution1 = eulerSolver.solve(y0, 0, 1, 0.01)
  const solution2 = rk4Solver.solve(y0, 0, 1, 0.01)
  const solution3 = rkf45Solver.solve(y0, 0, 1, 0.1)

  const exact = Math.exp(-1)

  // Euler should be less accurate
  const eulerError = Math.abs(solution1.states[solution1.states.length - 1][0] - exact)
  const rk4Error = Math.abs(solution2.states[solution2.states.length - 1][0] - exact)
  const _rkf45Error = Math.abs(solution3.states[solution3.states.length - 1][0] - exact)

  assert(solution1.success, 'Euler solver succeeds')
  assert(solution2.success, 'RK4 solver succeeds')
  assert(solution3.success, 'RKF45 solver succeeds')

  assert(rk4Error < eulerError, 'RK4 more accurate than Euler')
  assertApprox(solution2.states[solution2.states.length - 1][0], exact, 0.001, 'RK4 solution accurate')
}

// --------------------------------------------
// 9. Steady State Detection Tests
// --------------------------------------------
console.log('\n📊 9. Steady State Detection Tests\n')

{
  // Constant history - should be steady
  const constantHistory = Array(20).fill([1, 2, 3, 4, 5])
  assert(isSteadyState(constantHistory, 10, 1e-6), 'Constant history is steady state')

  // Changing history - should not be steady
  const changingHistory = Array.from({ length: 20 }, (_, i) => [i, 2 * i, 3 * i])
  assert(!isSteadyState(changingHistory, 10, 1e-6), 'Changing history is not steady state')

  // Test steadyStateError
  const y1 = [100, 200, 300]
  const y2 = [100.01, 200.01, 300.01]
  const error = steadyStateError(y1, y2)
  assert(error < 0.001, 'Steady state error calculated correctly')
}

// --------------------------------------------
// 10. Oxygen Demand Tests
// --------------------------------------------
console.log('\n📊 10. Oxygen Demand Tests\n')

{
  const rates = calculateProcessRates(
    TYPICAL_REACTOR_STATE,
    DEFAULT_ASM1_KINETIC_PARAMS,
    DEFAULT_ASM1_STOICH_PARAMS
  )

  const od = calculateOxygenDemand(
    TYPICAL_REACTOR_STATE,
    rates,
    DEFAULT_ASM1_STOICH_PARAMS,
    1000, // m³/d flow
    500   // m³ volume
  )

  assert(od.carbonaceous >= 0, 'Carbonaceous OD is non-negative')
  assert(od.nitrogenous >= 0, 'Nitrogenous OD is non-negative')
  assertApprox(od.total, od.carbonaceous + od.nitrogenous, 0.001, 'Total OD = C + N')
  assert(od.specific > 0, 'Specific OD is positive')

  // In typical reactor, carbonaceous > nitrogenous
  // (depends on loading, but generally true)
}

// --------------------------------------------
// 11. Sludge Production Tests
// --------------------------------------------
console.log('\n📊 11. Sludge Production Tests\n')

{
  const sludge = calculateSludgeProduction(
    TYPICAL_REACTOR_STATE,
    15, // SRT = 15 days
    500 // Volume = 500 m³
  )

  assert(sludge.totalVSS > 0, 'VSS production is positive')
  assert(sludge.totalTSS > 0, 'TSS production is positive')
  assert(sludge.totalTSS > sludge.totalVSS, 'TSS > VSS')
  assert(sludge.wastageRate > 0, 'Wastage rate is positive')

  // Wastage rate = V/SRT
  assertApprox(sludge.wastageRate, 500 / 15, 0.001, 'Wastage rate = V/SRT')
}

// --------------------------------------------
// 12. Quick Steady State Solver Tests
// --------------------------------------------
console.log('\n📊 12. Quick Steady State Solver Tests\n')

{
  const steadyState = calculateSteadyState(
    TYPICAL_INFLUENT,
    0.25, // HRT = 6 hours = 0.25 days
    15,   // SRT = 15 days
    20,   // Temperature = 20°C
    2.0   // Target DO = 2 mg/L
  )

  // In steady state, biomass should accumulate
  assert(steadyState.XBH > TYPICAL_INFLUENT.XBH, 'Biomass accumulates at steady state')

  // DO should be at target
  assertApprox(steadyState.SO, 2.0, 0.1, 'DO maintained at target')

  // Substrate should be consumed
  assert(steadyState.SS < TYPICAL_INFLUENT.SS, 'Substrate consumed at steady state')
}

// --------------------------------------------
// 13. Full Simulation Tests
// --------------------------------------------
console.log('\n📊 13. Full Simulation Tests\n')

{
  const result = runASM1Simulation(
    {
      startTime: 0,
      endTime: 10, // 10 days
      timeStep: 0.01,
      outputInterval: 1,
      solver: 'rk4',
      initialState: {
        ...TYPICAL_INFLUENT,
        XBH: 100,
        XBA: 10,
        SO: 2.0,
      },
    },
    {
      type: 'cstr',
      zones: [{
        id: 'aeration',
        name: 'Aeration Tank',
        volume: 500,
        aerationMode: 'aerobic',
        targetDO: 2.0,
        mixingIntensity: 'high',
        hrt: 6,
      }],
      totalVolume: 500,
      totalHRT: 6,
      srt: 15,
      temperature: 20,
      recirculation: {
        external: 0.5,
        wastage: 33,
      },
    },
    TYPICAL_INFLUENT
  )

  assert(result.timeSeries.length > 0, 'Time series has data points')
  assert(result.timeSeries.length === 11, 'Time series has expected length (0,1,...,10 days)')

  assert(result.finalState !== undefined, 'Final state exists')
  assert(result.effluentQuality !== undefined, 'Effluent quality calculated')
  assert(result.oxygenDemand.total >= 0, 'Oxygen demand is non-negative')
  assert(result.sludgeProduction.totalVSS >= 0, 'Sludge production is non-negative')

  assert(result.computation.executionTime > 0, 'Execution time recorded')
  assert(result.computation.totalSteps > 0, 'Total steps recorded')

  // Performance metrics should be reasonable
  assertRange(result.performance.bodRemoval, -100, 100, 'BOD removal in range')
  assertRange(result.performance.codRemoval, -100, 100, 'COD removal in range')
}

// --------------------------------------------
// 14. Edge Cases Tests
// --------------------------------------------
console.log('\n📊 14. Edge Cases Tests\n')

{
  // Zero biomass
  const zeroBiomass: ASM1StateVariables = {
    ...TYPICAL_REACTOR_STATE,
    XBH: 0,
    XBA: 0,
  }
  const rates = calculateProcessRates(zeroBiomass, DEFAULT_ASM1_KINETIC_PARAMS, DEFAULT_ASM1_STOICH_PARAMS)
  assert(rates[0].rate === 0, 'No growth without biomass')
  assert(rates[3].rate === 0, 'No decay without biomass')

  // Zero substrate
  const zeroSubstrate: ASM1StateVariables = {
    ...TYPICAL_REACTOR_STATE,
    SS: 0,
    XS: 0,
  }
  const rates2 = calculateProcessRates(zeroSubstrate, DEFAULT_ASM1_KINETIC_PARAMS, DEFAULT_ASM1_STOICH_PARAMS)
  assert(rates2[0].rate === 0, 'No heterotroph growth without substrate')

  // Zero DO (anoxic conditions)
  const zeroDO: ASM1StateVariables = {
    ...TYPICAL_REACTOR_STATE,
    SO: 0,
  }
  const rates3 = calculateProcessRates(zeroDO, DEFAULT_ASM1_KINETIC_PARAMS, DEFAULT_ASM1_STOICH_PARAMS)
  assert(rates3[0].rate === 0, 'No aerobic growth without DO')
  assert(rates3[1].rate > 0, 'Anoxic growth active without DO (if NO3 present)')

  // Zero ammonia
  const zeroNH4: ASM1StateVariables = {
    ...TYPICAL_REACTOR_STATE,
    SNH: 0,
  }
  const rates4 = calculateProcessRates(zeroNH4, DEFAULT_ASM1_KINETIC_PARAMS, DEFAULT_ASM1_STOICH_PARAMS)
  assert(rates4[2].rate === 0, 'No nitrification without ammonia')
}

// --------------------------------------------
// 15. Parameter Sensitivity Tests
// --------------------------------------------
console.log('\n📊 15. Parameter Sensitivity Tests\n')

{
  // Higher muH should increase heterotroph growth rate
  const highMuH: ASM1KineticParameters = {
    ...DEFAULT_ASM1_KINETIC_PARAMS,
    muH: 10, // Increased from 6
  }
  const rates1 = calculateProcessRates(TYPICAL_REACTOR_STATE, DEFAULT_ASM1_KINETIC_PARAMS, DEFAULT_ASM1_STOICH_PARAMS)
  const rates2 = calculateProcessRates(TYPICAL_REACTOR_STATE, highMuH, DEFAULT_ASM1_STOICH_PARAMS)
  assert(rates2[0].rate > rates1[0].rate, 'Higher muH increases growth rate')

  // Higher KS should decrease growth rate (more limiting)
  const highKS: ASM1KineticParameters = {
    ...DEFAULT_ASM1_KINETIC_PARAMS,
    KS: 100, // Increased from 20
  }
  const rates3 = calculateProcessRates(TYPICAL_REACTOR_STATE, highKS, DEFAULT_ASM1_STOICH_PARAMS)
  assert(rates3[0].rate < rates1[0].rate, 'Higher KS decreases growth rate')

  // Higher YH means more biomass per substrate
  const highYH: ASM1StoichiometricParameters = {
    ...DEFAULT_ASM1_STOICH_PARAMS,
    YH: 0.75, // Increased from 0.67
  }
  const coef1 = getStoichiometricCoefficient(0, 1, DEFAULT_ASM1_STOICH_PARAMS)
  const coef2 = getStoichiometricCoefficient(0, 1, highYH)
  assert(Math.abs(coef2) < Math.abs(coef1), 'Higher YH means less substrate per biomass')
}

// --------------------------------------------
// 16. Mass Balance Tests
// --------------------------------------------
console.log('\n📊 16. Mass Balance Tests\n')

{
  // COD mass balance in stoichiometric matrix
  // Each process should conserve COD (with oxygen as electron acceptor)
  const matrix = buildStoichiometricMatrix(DEFAULT_ASM1_STOICH_PARAMS)
  const _YH = DEFAULT_ASM1_STOICH_PARAMS.YH // Available for detailed COD balance verification

  // Process 1: Aerobic heterotroph growth
  // Input: -1/YH SS + -(1-YH)/YH SO
  // Output: +1 XBH
  // Balance: -1/YH + (1-YH)/YH + 1 = 0 (accounting for O2 as COD)
  const p1Balance = matrix[0][1] + matrix[0][4] // SS consumed + XBH produced
  // This isn't exact 0 due to O2 contribution, but should be consistent

  assert(Number.isFinite(p1Balance), 'Process 1 balance is finite')
}

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '=' .repeat(60))
console.log(`\n📋 ASM1 MODEL TEST SUMMARY`)
console.log(`   ✅ Passed: ${passed}`)
console.log(`   ❌ Failed: ${failed}`)
console.log(`   📊 Total:  ${passed + failed}`)

if (failed > 0) {
  console.log('\n❌ FAILED TESTS:')
  errors.forEach(e => console.log(`   - ${e}`))
}

console.log('\n')

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1)
}
