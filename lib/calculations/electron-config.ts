// VerChem - Quantum Chemistry: Electron Configuration Calculator
// Generates electron configurations, orbital diagrams, and quantum number explanations

/**
 * Quantum Numbers
 */
export interface QuantumNumbers {
  n: number // Principal quantum number (shell)
  l: number // Azimuthal quantum number (subshell)
  m: number // Magnetic quantum number (orbital)
  s: number // Spin quantum number (+1/2 or -1/2)
}

/**
 * Orbital Data
 */
export interface Orbital {
  name: string // e.g., "1s", "2p", "3d"
  n: number // Principal quantum number
  l: number // Azimuthal quantum number (0=s, 1=p, 2=d, 3=f)
  maxElectrons: number // Maximum electrons (2 for all)
  electrons: number // Current electrons
  order: number // Aufbau filling order
}

/**
 * Subshell Data
 */
export interface Subshell {
  name: string // e.g., "1s", "2p", "3d"
  n: number
  l: number
  lSymbol: string // s, p, d, f
  maxElectrons: number // 2, 6, 10, 14
  electrons: number
  orbitals: Orbital[]
}

/**
 * Electron Configuration Result
 */
export interface ElectronConfiguration {
  atomicNumber: number
  element: string
  fullConfig: string // e.g., "1s² 2s² 2p⁶"
  nobleGasConfig: string // e.g., "[Ne] 3s²"
  condensedConfig: string // Shorthand
  subshells: Subshell[]
  valenceElectrons: number
  valenceConfig: string
  orbitalBoxDiagram: OrbitalBox[]
  electronDots: string[] // Lewis dot representation
  quantumNumbers: QuantumNumbers[] // All electrons
  exceptions?: string // For Cr, Cu, etc.
}

/**
 * Orbital Box (for box diagram visualization)
 */
export interface OrbitalBox {
  subshell: string // e.g., "3d"
  boxes: {
    orbital: string // e.g., "3dxy"
    electrons: ('↑' | '↓' | null)[] // Max 2 electrons
  }[]
}

/**
 * Aufbau Order - Correct orbital filling sequence
 * Based on (n + l) rule, then by n
 */
export const AUFBAU_ORDER = [
  { name: '1s', n: 1, l: 0, order: 1 },
  { name: '2s', n: 2, l: 0, order: 2 },
  { name: '2p', n: 2, l: 1, order: 3 },
  { name: '3s', n: 3, l: 0, order: 4 },
  { name: '3p', n: 3, l: 1, order: 5 },
  { name: '4s', n: 4, l: 0, order: 6 },
  { name: '3d', n: 3, l: 2, order: 7 },
  { name: '4p', n: 4, l: 1, order: 8 },
  { name: '5s', n: 5, l: 0, order: 9 },
  { name: '4d', n: 4, l: 2, order: 10 },
  { name: '5p', n: 5, l: 1, order: 11 },
  { name: '6s', n: 6, l: 0, order: 12 },
  { name: '4f', n: 4, l: 3, order: 13 },
  { name: '5d', n: 5, l: 2, order: 14 },
  { name: '6p', n: 6, l: 1, order: 15 },
  { name: '7s', n: 7, l: 0, order: 16 },
  { name: '5f', n: 5, l: 3, order: 17 },
  { name: '6d', n: 6, l: 2, order: 18 },
  { name: '7p', n: 7, l: 1, order: 19 },
]

/**
 * Maximum electrons per subshell type
 */
const MAX_ELECTRONS: { [key: string]: number } = {
  s: 2,
  p: 6,
  d: 10,
  f: 14,
}

/**
 * Noble gases for condensed notation
 */
const NOBLE_GASES = [
  { symbol: 'He', atomicNumber: 2, config: '1s²' },
  { symbol: 'Ne', atomicNumber: 10, config: '1s² 2s² 2p⁶' },
  { symbol: 'Ar', atomicNumber: 18, config: '[Ne] 3s² 3p⁶' },
  { symbol: 'Kr', atomicNumber: 36, config: '[Ar] 3d¹⁰ 4s² 4p⁶' },
  { symbol: 'Xe', atomicNumber: 54, config: '[Kr] 4d¹⁰ 5s² 5p⁶' },
  { symbol: 'Rn', atomicNumber: 86, config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶' },
  { symbol: 'Og', atomicNumber: 118, config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶' },
]

/**
 * Exceptions to Aufbau Principle
 * Elements with unusual electron configurations for stability
 */
const ELECTRON_CONFIG_EXCEPTIONS: { [key: number]: string } = {
  24: '[Ar] 3d⁵ 4s¹', // Cr - half-filled d subshell
  29: '[Ar] 3d¹⁰ 4s¹', // Cu - filled d subshell
  41: '[Kr] 4d⁴ 5s¹', // Nb
  42: '[Kr] 4d⁵ 5s¹', // Mo
  44: '[Kr] 4d⁷ 5s¹', // Ru
  45: '[Kr] 4d⁸ 5s¹', // Rh
  46: '[Kr] 4d¹⁰', // Pd
  47: '[Kr] 4d¹⁰ 5s¹', // Ag
  57: '[Xe] 5d¹ 6s²', // La
  58: '[Xe] 4f¹ 5d¹ 6s²', // Ce
  64: '[Xe] 4f⁷ 5d¹ 6s²', // Gd
  78: '[Xe] 4f¹⁴ 5d⁹ 6s¹', // Pt
  79: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', // Au
  89: '[Rn] 6d¹ 7s²', // Ac
  90: '[Rn] 6d² 7s²', // Th
  91: '[Rn] 5f² 6d¹ 7s²', // Pa
  92: '[Rn] 5f³ 6d¹ 7s²', // U
  93: '[Rn] 5f⁴ 6d¹ 7s²', // Np
  96: '[Rn] 5f⁷ 6d¹ 7s²', // Cm
  103: '[Rn] 5f¹⁴ 6d¹ 7s²', // Lr
}

/**
 * Get l symbol from l quantum number
 */
function getLSymbol(l: number): string {
  const symbols = ['s', 'p', 'd', 'f', 'g', 'h']
  return symbols[l] || '?'
}

/**
 * Get superscript number for electron count
 */
function toSuperscript(n: number): string {
  const superscripts: { [key: string]: string } = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  }
  return n
    .toString()
    .split('')
    .map((d) => superscripts[d] || d)
    .join('')
}

/**
 * Calculate electron configuration for an element
 */
export function calculateElectronConfiguration(
  atomicNumber: number,
  elementSymbol: string = '',
  applyExceptions: boolean = true
): ElectronConfiguration {
  // Check for exceptions first (only on the initial call to avoid infinite recursion)
  if (applyExceptions) {
    const exceptionConfig = ELECTRON_CONFIG_EXCEPTIONS[atomicNumber]
    if (exceptionConfig) {
      const standardConfig = calculateElectronConfiguration(
        atomicNumber,
        elementSymbol,
        false
      )
      return parseExceptionConfig(atomicNumber, exceptionConfig, standardConfig)
    }
  }

  const subshells: Subshell[] = []
  let remainingElectrons = atomicNumber
  const quantumNumbers: QuantumNumbers[] = []

  // Fill orbitals according to Aufbau principle
  for (const aufbauOrbital of AUFBAU_ORDER) {
    if (remainingElectrons <= 0) break

    const lSymbol = getLSymbol(aufbauOrbital.l)
    const maxElectrons = MAX_ELECTRONS[lSymbol]
    const electronsInSubshell = Math.min(remainingElectrons, maxElectrons)

    // Create orbitals for this subshell
    const orbitals: Orbital[] = []
    const numOrbitals = (aufbauOrbital.l * 2 + 1) // s=1, p=3, d=5, f=7

    // Distribute electrons among orbitals (Hund's rule)
    let electronsToDistribute = electronsInSubshell
    const orbitalElectrons: number[] = new Array(numOrbitals).fill(0)

    // First pass: add one electron to each orbital (Hund's rule)
    for (let i = 0; i < numOrbitals && electronsToDistribute > 0; i++) {
      orbitalElectrons[i] = 1
      electronsToDistribute--
    }

    // Second pass: pair up electrons
    for (let i = 0; i < numOrbitals && electronsToDistribute > 0; i++) {
      orbitalElectrons[i] = 2
      electronsToDistribute--
    }

    // Create orbital objects
    for (let i = 0; i < numOrbitals; i++) {
      const m = i - aufbauOrbital.l // Magnetic quantum number
      orbitals.push({
        name: `${aufbauOrbital.name}_${i}`,
        n: aufbauOrbital.n,
        l: aufbauOrbital.l,
        maxElectrons: 2,
        electrons: orbitalElectrons[i],
        order: aufbauOrbital.order,
      })

      // Add quantum numbers for each electron
      for (let e = 0; e < orbitalElectrons[i]; e++) {
        quantumNumbers.push({
          n: aufbauOrbital.n,
          l: aufbauOrbital.l,
          m: m,
          s: e === 0 ? 0.5 : -0.5, // Spin up first, then down
        })
      }
    }

    subshells.push({
      name: aufbauOrbital.name,
      n: aufbauOrbital.n,
      l: aufbauOrbital.l,
      lSymbol: lSymbol,
      maxElectrons: maxElectrons,
      electrons: electronsInSubshell,
      orbitals: orbitals,
    })

    remainingElectrons -= electronsInSubshell
  }

  // Generate full configuration string
  const fullConfig = subshells
    .map((s) => `${s.name}${toSuperscript(s.electrons)}`)
    .join(' ')

  // Generate noble gas configuration
  const { nobleGasConfig, condensedConfig } = getNobleGasNotation(
    atomicNumber,
    subshells
  )

  // Identify valence electrons
  const { valenceElectrons, valenceConfig } = getValenceElectrons(
    atomicNumber,
    subshells
  )

  // Generate orbital box diagram
  const orbitalBoxDiagram = generateOrbitalBoxDiagram(subshells)

  // Generate electron dots (Lewis notation)
  const electronDots = generateElectronDots(valenceElectrons)

  return {
    atomicNumber,
    element: elementSymbol,
    fullConfig,
    nobleGasConfig,
    condensedConfig,
    subshells,
    valenceElectrons,
    valenceConfig,
    orbitalBoxDiagram,
    electronDots,
    quantumNumbers,
  }
}

/**
 * Parse exception configuration
 */
function parseExceptionConfig(
  atomicNumber: number,
  configString: string,
  standardConfig: ElectronConfiguration
): ElectronConfiguration {
  return {
    ...standardConfig,
    nobleGasConfig: configString,
    condensedConfig: configString,
    exceptions: getExceptionExplanation(atomicNumber),
  }
}

/**
 * Get exception explanation
 */
function getExceptionExplanation(atomicNumber: number): string {
  const explanations: { [key: number]: string } = {
    24: 'Chromium: Half-filled d subshell (3d⁵) is more stable',
    29: 'Copper: Filled d subshell (3d¹⁰) is more stable',
    41: 'Niobium: Exception for d-block stability',
    42: 'Molybdenum: Half-filled d subshell stability',
    46: 'Palladium: Completely filled d subshell, no s electrons',
    47: 'Silver: Filled d subshell stability',
    78: 'Platinum: d-block exception for stability',
    79: 'Gold: Filled d subshell stability',
  }

  return explanations[atomicNumber] || 'Electron configuration exception for stability'
}

/**
 * Get noble gas notation
 */
function getNobleGasNotation(
  atomicNumber: number,
  subshells: Subshell[]
): { nobleGasConfig: string; condensedConfig: string } {
  // Find the largest noble gas before this element
  let nobleGas: typeof NOBLE_GASES[0] | null = null
  for (const ng of NOBLE_GASES) {
    if (ng.atomicNumber < atomicNumber) {
      nobleGas = ng
    } else {
      break
    }
  }

  // If no prior noble gas (H, He), use full configuration
  if (!nobleGas) {
    const fullConfig = subshells
      .map((s) => `${s.name}${toSuperscript(s.electrons)}`)
      .join(' ')
    return {
      nobleGasConfig: fullConfig,
      condensedConfig: fullConfig,
    }
  }

  if (nobleGas.atomicNumber === atomicNumber) {
    // This IS a noble gas
    return {
      nobleGasConfig: subshells
        .map((s) => `${s.name}${toSuperscript(s.electrons)}`)
        .join(' '),
      condensedConfig: `[${nobleGas.symbol}]`,
    }
  }

  // Get remaining subshells after noble gas
  const remainingConfig: string[] = []
  let electronCount = 0

  for (const subshell of subshells) {
    electronCount += subshell.electrons
    if (electronCount > nobleGas.atomicNumber) {
      // Calculate how many electrons from this subshell
      const electronsFromThisSubshell =
        subshell.electrons - (electronCount - subshell.electrons - nobleGas.atomicNumber)
      if (electronsFromThisSubshell > 0) {
        remainingConfig.push(
          `${subshell.name}${toSuperscript(electronsFromThisSubshell)}`
        )
      }
    } else if (electronCount === nobleGas.atomicNumber) {
      // Start from next subshell
      continue
    }
  }

  const nobleGasConfig = `[${nobleGas.symbol}] ${remainingConfig.join(' ')}`
  const condensedConfig = nobleGasConfig

  return { nobleGasConfig, condensedConfig }
}

/**
 * Get valence electrons
 */
function getValenceElectrons(
  atomicNumber: number,
  subshells: Subshell[]
): { valenceElectrons: number; valenceConfig: string } {
  // Valence electrons are in the outermost shell
  // For transition metals, include (n)s and (n-1)d
  // For main group, include (n)s and (n)p

  const maxN = Math.max(...subshells.map((s) => s.n))
  const valenceSubshells = subshells.filter(
    (s) => s.n === maxN || (s.n === maxN - 1 && s.lSymbol === 'd')
  )

  const valenceElectrons = valenceSubshells.reduce((sum, s) => sum + s.electrons, 0)
  const valenceConfig = valenceSubshells
    .map((s) => `${s.name}${toSuperscript(s.electrons)}`)
    .join(' ')

  return { valenceElectrons, valenceConfig }
}

/**
 * Generate orbital box diagram data
 */
function generateOrbitalBoxDiagram(subshells: Subshell[]): OrbitalBox[] {
  const boxes: OrbitalBox[] = []

  for (const subshell of subshells) {
    const orbitalBoxes: { orbital: string; electrons: ('↑' | '↓' | null)[] }[] = []

    for (const orbital of subshell.orbitals) {
      const electrons: ('↑' | '↓' | null)[] = []

      if (orbital.electrons === 1) {
        electrons.push('↑', null)
      } else if (orbital.electrons === 2) {
        electrons.push('↑', '↓')
      } else {
        electrons.push(null, null)
      }

      orbitalBoxes.push({
        orbital: orbital.name,
        electrons,
      })
    }

    boxes.push({
      subshell: subshell.name,
      boxes: orbitalBoxes,
    })
  }

  return boxes
}

/**
 * Generate electron dots (Lewis dot structure)
 */
function generateElectronDots(valenceElectrons: number): string[] {
  const dots: string[] = []
  const positions = ['top', 'right', 'bottom', 'left']

  // Add up to 8 dots (octet)
  const dotsToAdd = Math.min(valenceElectrons, 8)

  // First 4 electrons go in different positions
  for (let i = 0; i < Math.min(dotsToAdd, 4); i++) {
    dots.push(positions[i])
  }

  // Next 4 electrons pair up
  for (let i = 4; i < dotsToAdd; i++) {
    dots.push(positions[i - 4])
  }

  return dots
}

/**
 * Format electron configuration with HTML superscripts
 */
export function formatConfigHTML(config: string): string {
  return config.replace(/(\d+)/g, '<sup>$1</sup>')
}

/**
 * Get explanation of quantum numbers
 */
export function getQuantumNumberExplanation(): {
  n: string
  l: string
  m: string
  s: string
} {
  return {
    n: 'Principal quantum number (n): Determines the shell/energy level (1, 2, 3, ...). Higher n = higher energy, farther from nucleus.',
    l: 'Azimuthal quantum number (l): Determines the subshell shape (0=s, 1=p, 2=d, 3=f). Range: 0 to (n-1).',
    m: 'Magnetic quantum number (m): Determines orbital orientation in space. Range: -l to +l.',
    s: 'Spin quantum number (s): Determines electron spin direction (+½ = ↑, -½ = ↓). Each orbital holds max 2 electrons with opposite spins.',
  }
}

/**
 * Get Aufbau Principle explanation
 */
export function getAufbauPrincipleExplanation(): string {
  return `Aufbau Principle: Electrons fill orbitals starting from the lowest energy level.

Filling Order: 1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p → 5s → 4d → 5p → 6s → 4f → 5d → 6p → 7s → 5f → 6d → 7p

The order follows (n + l) rule:
- Orbitals with lower (n + l) fill first
- If (n + l) is same, lower n fills first
- Example: 3d (n+l = 5) fills after 4s (n+l = 4)`
}

/**
 * Get Hund's Rule explanation
 */
export function getHundsRuleExplanation(): string {
  return `Hund's Rule: Maximize the number of unpaired electrons.

When filling degenerate orbitals (same energy):
1. Add one electron to each orbital first (parallel spins)
2. Then pair up electrons

Example (Nitrogen, 2p³):
2p: [↑] [↑] [↑]  ✓ Correct (maximum unpaired)
2p: [↑↓] [↑] [ ]  ✗ Wrong (premature pairing)

This minimizes electron-electron repulsion and maximizes stability.`
}

/**
 * Get Pauli Exclusion Principle explanation
 */
export function getPauliExclusionExplanation(): string {
  return `Pauli Exclusion Principle: No two electrons can have the same set of quantum numbers.

Consequences:
- Maximum 2 electrons per orbital
- They must have opposite spins (↑↓)
- Each electron is uniquely identified by (n, l, m, s)

Example (Helium, 1s²):
Both electrons in 1s orbital:
Electron 1: n=1, l=0, m=0, s=+½
Electron 2: n=1, l=0, m=0, s=-½  ✓

Same quantum numbers except spin!`
}

/**
 * Animation Step for Orbital Filling
 */
export interface AnimationStep {
  electronNumber: number // Which electron (1 to atomicNumber)
  subshell: string // e.g., "1s", "2p", "3d"
  orbital: number // Which orbital in subshell (0, 1, 2, ...)
  spin: '↑' | '↓' // Spin direction
  configSoFar: string // Configuration up to this point
  description: string // Human-readable description
  highlightSubshell: string // Which subshell to highlight
  color: string // Color for this orbital type
}

/**
 * Orbital colors for visualization
 */
export const ORBITAL_COLORS: { [key: string]: string } = {
  s: '#3b82f6', // Blue
  p: '#10b981', // Green
  d: '#f59e0b', // Amber/Orange
  f: '#ec4899', // Pink
}

/**
 * Generate step-by-step orbital filling animation
 */
export function generateOrbitalFillingAnimation(
  atomicNumber: number
): AnimationStep[] {
  const steps: AnimationStep[] = []
  let electronCount = 0
  const subshellStates: { [key: string]: { orbitals: number[]; index: number } } = {}

  // Check for exceptions
  const isException = ELECTRON_CONFIG_EXCEPTIONS[atomicNumber] !== undefined

  for (const aufbauOrbital of AUFBAU_ORDER) {
    if (electronCount >= atomicNumber) break

    const lSymbol = getLSymbol(aufbauOrbital.l)
    const maxElectrons = MAX_ELECTRONS[lSymbol]
    const numOrbitals = aufbauOrbital.l * 2 + 1
    const color = ORBITAL_COLORS[lSymbol] || '#6b7280'

    // Initialize subshell state
    if (!subshellStates[aufbauOrbital.name]) {
      subshellStates[aufbauOrbital.name] = {
        orbitals: new Array(numOrbitals).fill(0),
        index: 0,
      }
    }

    const state = subshellStates[aufbauOrbital.name]
    const electronsToAdd = Math.min(
      atomicNumber - electronCount,
      maxElectrons - state.orbitals.reduce((sum, e) => sum + e, 0)
    )

    // Add electrons following Hund's rule
    for (let i = 0; i < electronsToAdd; i++) {
      electronCount++

      // First pass: add one electron to each orbital (spin up)
      if (state.index < numOrbitals) {
        state.orbitals[state.index] = 1
        steps.push({
          electronNumber: electronCount,
          subshell: aufbauOrbital.name,
          orbital: state.index,
          spin: '↑',
          configSoFar: generateConfigString(subshellStates),
          description: `Electron ${electronCount}: Adding to ${aufbauOrbital.name} orbital ${
            state.index + 1
          } (spin ↑)`,
          highlightSubshell: aufbauOrbital.name,
          color,
        })
        state.index++
      }
      // Second pass: pair electrons (spin down)
      else {
        const orbitalToPair = state.orbitals.findIndex((e) => e === 1)
        if (orbitalToPair !== -1) {
          state.orbitals[orbitalToPair] = 2
          steps.push({
            electronNumber: electronCount,
            subshell: aufbauOrbital.name,
            orbital: orbitalToPair,
            spin: '↓',
            configSoFar: generateConfigString(subshellStates),
            description: `Electron ${electronCount}: Pairing in ${aufbauOrbital.name} orbital ${
              orbitalToPair + 1
            } (spin ↓)`,
            highlightSubshell: aufbauOrbital.name,
            color,
          })
        }
      }
    }
  }

  // Add exception note if applicable
  if (isException && steps.length > 0) {
    const lastStep = steps[steps.length - 1]
    lastStep.description += ` [Note: ${getExceptionExplanation(atomicNumber)}]`
  }

  return steps
}

/**
 * Generate configuration string from current subshell states
 */
function generateConfigString(subshellStates: {
  [key: string]: { orbitals: number[] }
}): string {
  const configs: string[] = []

  for (const aufbauOrbital of AUFBAU_ORDER) {
    const state = subshellStates[aufbauOrbital.name]
    if (state) {
      const totalElectrons = state.orbitals.reduce((sum, e) => sum + e, 0)
      if (totalElectrons > 0) {
        configs.push(`${aufbauOrbital.name}${toSuperscript(totalElectrons)}`)
      }
    }
  }

  return configs.join(' ')
}

/**
 * Get orbital name with subscripts for orientation
 * Used for detailed orbital diagrams
 */
export function getOrbitalName(
  subshellName: string,
  orbitalIndex: number
): string {
  const lSymbol = subshellName.slice(-1)

  if (lSymbol === 's') return subshellName

  if (lSymbol === 'p') {
    const pOrbitals = ['x', 'y', 'z']
    return `${subshellName}${pOrbitals[orbitalIndex] || orbitalIndex}`
  }

  if (lSymbol === 'd') {
    const dOrbitals = ['xy', 'xz', 'yz', 'x²-y²', 'z²']
    return `${subshellName}${dOrbitals[orbitalIndex] || orbitalIndex}`
  }

  if (lSymbol === 'f') {
    // f orbitals are complex, use generic numbering
    return `${subshellName}_${orbitalIndex + 1}`
  }

  return `${subshellName}_${orbitalIndex}`
}

/**
 * Get visual representation of orbital shape
 * Returns emoji/symbol for orbital visualization
 */
export function getOrbitalShape(lSymbol: string): {
  symbol: string
  description: string
} {
  const shapes: { [key: string]: { symbol: string; description: string } } = {
    s: { symbol: '●', description: 'Spherical' },
    p: { symbol: '∞', description: 'Dumbbell (figure-8)' },
    d: { symbol: '✿', description: 'Cloverleaf (4-lobed)' },
    f: { symbol: '❀', description: 'Complex (multi-lobed)' },
  }

  return shapes[lSymbol] || { symbol: '?', description: 'Unknown' }
}

/**
 * Get periodic table block from electron configuration
 */
export function getPeriodicBlock(config: ElectronConfiguration): string {
  const lastSubshell = config.subshells[config.subshells.length - 1]
  if (!lastSubshell) return 's-block'

  const lSymbol = lastSubshell.lSymbol
  return `${lSymbol}-block`
}

/**
 * Predict ion charge from electron configuration
 */
export function predictIonCharge(
  atomicNumber: number,
  valenceElectrons: number
): number[] {
  // Main group elements
  if (atomicNumber <= 20 || atomicNumber > 36) {
    if (valenceElectrons <= 3) {
      // Metals: lose electrons to form cations
      return [valenceElectrons]
    } else if (valenceElectrons >= 5 && valenceElectrons < 8) {
      // Nonmetals: gain electrons to form anions
      return [-(8 - valenceElectrons)]
    }
  }

  // Transition metals: multiple oxidation states
  if (atomicNumber >= 21 && atomicNumber <= 30) {
    return [2, 3] // Common transition metal charges
  }

  return [0] // Noble gases or complex cases
}
