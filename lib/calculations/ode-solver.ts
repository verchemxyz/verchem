/**
 * VerChem - ODE Solver for ASM1 Dynamic Simulation
 *
 * Numerical methods for solving systems of ordinary differential equations.
 * Implements multiple solver algorithms from simple Euler to adaptive RK methods.
 *
 * Reference: Press et al. (2007) "Numerical Recipes" 3rd Edition
 */

import { ODESolverMethod } from '../types/asm1-model'

// ============================================
// TYPES
// ============================================

/**
 * State vector type (array of numbers)
 */
export type StateVector = number[]

/**
 * Derivative function signature
 * Takes current time and state, returns derivatives
 */
export type DerivativeFunction = (t: number, y: StateVector) => StateVector

/**
 * ODE Solver configuration
 */
export interface ODESolverConfig {
  method: ODESolverMethod
  tolerance?: number        // For adaptive methods (default 1e-6)
  minStep?: number          // Minimum step size (default 1e-10)
  maxStep?: number          // Maximum step size (default 1.0)
  maxIterations?: number    // Max iterations per step (default 1000)
}

/**
 * Solver step result
 */
export interface StepResult {
  t: number                 // New time
  y: StateVector            // New state
  dt: number                // Step size used
  error?: number            // Error estimate (for adaptive)
  iterations?: number       // Iterations used
}

/**
 * Full solution result
 */
export interface ODESolution {
  times: number[]
  states: StateVector[]
  totalSteps: number
  success: boolean
  message?: string
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: Required<ODESolverConfig> = {
  method: 'rk4',
  tolerance: 1e-6,
  minStep: 1e-10,
  maxStep: 1.0,
  maxIterations: 1000,
}

// ============================================
// EULER METHOD (1st Order)
// ============================================

/**
 * Forward Euler method - Simple but least accurate
 * y(t+dt) = y(t) + dt * f(t, y)
 *
 * Order: O(dt)
 * Use for: Quick estimates, very stiff systems
 */
function eulerStep(
  f: DerivativeFunction,
  t: number,
  y: StateVector,
  dt: number
): StateVector {
  const dydt = f(t, y)
  return y.map((yi, i) => yi + dt * dydt[i])
}

// ============================================
// RUNGE-KUTTA 2nd ORDER (Heun's Method)
// ============================================

/**
 * Runge-Kutta 2nd order (Heun's improved Euler)
 * k1 = f(t, y)
 * k2 = f(t + dt, y + dt*k1)
 * y(t+dt) = y(t) + dt/2 * (k1 + k2)
 *
 * Order: O(dt²)
 */
function rk2Step(
  f: DerivativeFunction,
  t: number,
  y: StateVector,
  dt: number
): StateVector {
  const k1 = f(t, y)
  const y1 = y.map((yi, i) => yi + dt * k1[i])
  const k2 = f(t + dt, y1)

  return y.map((yi, i) => yi + (dt / 2) * (k1[i] + k2[i]))
}

// ============================================
// RUNGE-KUTTA 4th ORDER (Classical)
// ============================================

/**
 * Classical Runge-Kutta 4th order - The workhorse method
 * k1 = f(t, y)
 * k2 = f(t + dt/2, y + dt/2 * k1)
 * k3 = f(t + dt/2, y + dt/2 * k2)
 * k4 = f(t + dt, y + dt * k3)
 * y(t+dt) = y(t) + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
 *
 * Order: O(dt⁴)
 * Use for: Most applications, good accuracy/speed tradeoff
 */
function rk4Step(
  f: DerivativeFunction,
  t: number,
  y: StateVector,
  dt: number
): StateVector {
  const n = y.length

  // k1 = f(t, y)
  const k1 = f(t, y)

  // y1 = y + dt/2 * k1
  const y1 = new Array(n)
  for (let i = 0; i < n; i++) {
    y1[i] = y[i] + (dt / 2) * k1[i]
  }

  // k2 = f(t + dt/2, y1)
  const k2 = f(t + dt / 2, y1)

  // y2 = y + dt/2 * k2
  const y2 = new Array(n)
  for (let i = 0; i < n; i++) {
    y2[i] = y[i] + (dt / 2) * k2[i]
  }

  // k3 = f(t + dt/2, y2)
  const k3 = f(t + dt / 2, y2)

  // y3 = y + dt * k3
  const y3 = new Array(n)
  for (let i = 0; i < n; i++) {
    y3[i] = y[i] + dt * k3[i]
  }

  // k4 = f(t + dt, y3)
  const k4 = f(t + dt, y3)

  // y_new = y + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
  const yNew = new Array(n)
  for (let i = 0; i < n; i++) {
    yNew[i] = y[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
  }

  return yNew
}

// ============================================
// RUNGE-KUTTA-FEHLBERG (Adaptive RK45)
// ============================================

/**
 * Runge-Kutta-Fehlberg 4(5) - Adaptive step size control
 * Uses embedded 4th and 5th order methods for error estimation
 *
 * Order: O(dt⁴) with O(dt⁵) error estimate
 * Use for: High accuracy requirements, variable step problems
 */
interface RKF45Result {
  y4: StateVector      // 4th order estimate
  y5: StateVector      // 5th order estimate
  error: number        // Error estimate
}

function rkf45Step(
  f: DerivativeFunction,
  t: number,
  y: StateVector,
  dt: number
): RKF45Result {
  const n = y.length

  // Butcher tableau coefficients for RKF45
  const a = [0, 1 / 4, 3 / 8, 12 / 13, 1, 1 / 2]
  const b = [
    [],
    [1 / 4],
    [3 / 32, 9 / 32],
    [1932 / 2197, -7200 / 2197, 7296 / 2197],
    [439 / 216, -8, 3680 / 513, -845 / 4104],
    [-8 / 27, 2, -3544 / 2565, 1859 / 4104, -11 / 40],
  ]

  // 4th order coefficients
  const c4 = [25 / 216, 0, 1408 / 2565, 2197 / 4104, -1 / 5, 0]

  // 5th order coefficients
  const c5 = [16 / 135, 0, 6656 / 12825, 28561 / 56430, -9 / 50, 2 / 55]

  // Calculate k values
  const k: StateVector[] = new Array(6)

  // k1 = f(t, y)
  k[0] = f(t, y)

  // k2 to k6
  for (let stage = 1; stage <= 5; stage++) {
    const yTemp = new Array(n)
    for (let i = 0; i < n; i++) {
      let sum = 0
      for (let j = 0; j < stage; j++) {
        sum += b[stage][j] * k[j][i]
      }
      yTemp[i] = y[i] + dt * sum
    }
    k[stage] = f(t + a[stage] * dt, yTemp)
  }

  // Calculate 4th and 5th order estimates
  const y4 = new Array(n)
  const y5 = new Array(n)

  for (let i = 0; i < n; i++) {
    let sum4 = 0
    let sum5 = 0
    for (let j = 0; j < 6; j++) {
      sum4 += c4[j] * k[j][i]
      sum5 += c5[j] * k[j][i]
    }
    y4[i] = y[i] + dt * sum4
    y5[i] = y[i] + dt * sum5
  }

  // Error estimate (max of component-wise errors)
  let maxError = 0
  for (let i = 0; i < n; i++) {
    const err = Math.abs(y5[i] - y4[i])
    const scale = Math.max(Math.abs(y[i]), Math.abs(y4[i]), 1e-10)
    maxError = Math.max(maxError, err / scale)
  }

  return { y4, y5, error: maxError }
}

// ============================================
// ADAPTIVE STEP SIZE CONTROL
// ============================================

/**
 * Calculate optimal step size based on error estimate
 */
function calculateOptimalStep(
  currentStep: number,
  error: number,
  tolerance: number,
  minStep: number,
  maxStep: number,
  order: number = 4
): { newStep: number; accept: boolean } {
  const safety = 0.9 // Safety factor
  const pGrow = 0.2 // Power for step growth
  const pShrink = 0.25 // Power for step shrink
  const maxGrow = 5.0 // Maximum step growth factor
  const maxShrink = 0.1 // Maximum step shrink factor

  if (error <= tolerance) {
    // Accept step, possibly increase step size
    const factor = error > 0
      ? Math.min(maxGrow, safety * Math.pow(tolerance / error, pGrow))
      : maxGrow
    const newStep = Math.min(maxStep, Math.max(minStep, currentStep * factor))
    return { newStep, accept: true }
  } else {
    // Reject step, decrease step size
    const factor = Math.max(maxShrink, safety * Math.pow(tolerance / error, pShrink))
    const newStep = Math.max(minStep, currentStep * factor)
    return { newStep, accept: false }
  }
}

// ============================================
// MAIN SOLVER CLASS
// ============================================

/**
 * ODE Solver class for ASM1 simulations
 */
export class ODESolver {
  private config: Required<ODESolverConfig>
  private f: DerivativeFunction

  constructor(
    derivativeFunction: DerivativeFunction,
    config: Partial<ODESolverConfig> = {}
  ) {
    this.f = derivativeFunction
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Take a single step
   */
  step(t: number, y: StateVector, dt: number): StepResult {
    switch (this.config.method) {
      case 'euler':
        return {
          t: t + dt,
          y: eulerStep(this.f, t, y, dt),
          dt,
        }

      case 'rk2':
        return {
          t: t + dt,
          y: rk2Step(this.f, t, y, dt),
          dt,
        }

      case 'rk4':
        return {
          t: t + dt,
          y: rk4Step(this.f, t, y, dt),
          dt,
        }

      case 'rkf45':
        return this.adaptiveStep(t, y, dt)

      default:
        return {
          t: t + dt,
          y: rk4Step(this.f, t, y, dt),
          dt,
        }
    }
  }

  /**
   * Adaptive step with RKF45
   */
  private adaptiveStep(t: number, y: StateVector, dt: number): StepResult {
    let currentDt = dt
    let iterations = 0

    while (iterations < this.config.maxIterations) {
      const result = rkf45Step(this.f, t, y, currentDt)
      const { newStep, accept } = calculateOptimalStep(
        currentDt,
        result.error,
        this.config.tolerance,
        this.config.minStep,
        this.config.maxStep
      )

      if (accept) {
        return {
          t: t + currentDt,
          y: result.y5, // Use higher order estimate
          dt: currentDt,
          error: result.error,
          iterations: iterations + 1,
        }
      }

      currentDt = newStep
      iterations++
    }

    // Max iterations reached, return best estimate
    const result = rkf45Step(this.f, t, y, currentDt)
    return {
      t: t + currentDt,
      y: result.y5,
      dt: currentDt,
      error: result.error,
      iterations,
    }
  }

  /**
   * Solve the ODE system from t0 to tEnd
   */
  solve(
    y0: StateVector,
    t0: number,
    tEnd: number,
    dt: number,
    outputInterval?: number
  ): ODESolution {
    const times: number[] = [t0]
    const states: StateVector[] = [y0.slice()] // Clone initial state

    let t = t0
    let y = y0.slice()
    let totalSteps = 0
    let currentDt = dt

    const outputDt = outputInterval ?? dt

    // Track next output time
    let nextOutput = t0 + outputDt

    while (t < tEnd - 1e-10) {
      // Ensure we don't overshoot
      const stepSize = Math.min(currentDt, tEnd - t)

      // Take a step
      const result = this.step(t, y, stepSize)
      t = result.t
      y = result.y
      totalSteps++

      // Update step size for adaptive methods
      if (this.config.method === 'rkf45') {
        currentDt = result.dt
      }

      // Store output at intervals
      if (t >= nextOutput - 1e-10) {
        times.push(t)
        states.push(y.slice())
        nextOutput += outputDt
      }

      // Safety check for infinite loop
      if (totalSteps > 1e7) {
        return {
          times,
          states,
          totalSteps,
          success: false,
          message: 'Maximum steps exceeded',
        }
      }
    }

    // Ensure final state is captured
    if (Math.abs(times[times.length - 1] - tEnd) > 1e-10) {
      times.push(t)
      states.push(y.slice())
    }

    return {
      times,
      states,
      totalSteps,
      success: true,
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Linear interpolation between two states
 */
export function interpolateState(
  t1: number,
  y1: StateVector,
  t2: number,
  y2: StateVector,
  t: number
): StateVector {
  const factor = (t - t1) / (t2 - t1)
  return y1.map((val, i) => val + factor * (y2[i] - val))
}

/**
 * Calculate steady state error (max relative change)
 */
export function steadyStateError(
  y1: StateVector,
  y2: StateVector,
  threshold: number = 1e-6
): number {
  let maxError = 0
  for (let i = 0; i < y1.length; i++) {
    const scale = Math.max(Math.abs(y1[i]), Math.abs(y2[i]), threshold)
    const error = Math.abs(y2[i] - y1[i]) / scale
    maxError = Math.max(maxError, error)
  }
  return maxError
}

/**
 * Check if steady state is reached
 */
export function isSteadyState(
  history: StateVector[],
  windowSize: number = 10,
  tolerance: number = 1e-4
): boolean {
  if (history.length < windowSize) return false

  const recent = history.slice(-windowSize)
  let maxChange = 0

  for (let i = 1; i < recent.length; i++) {
    const error = steadyStateError(recent[i - 1], recent[i])
    maxChange = Math.max(maxChange, error)
  }

  return maxChange < tolerance
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a configured ODE solver
 */
export function createODESolver(
  derivativeFunction: DerivativeFunction,
  method: ODESolverMethod = 'rk4',
  options: Partial<ODESolverConfig> = {}
): ODESolver {
  return new ODESolver(derivativeFunction, { method, ...options })
}

export default ODESolver
