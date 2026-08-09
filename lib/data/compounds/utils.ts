import { PERIODIC_TABLE } from '../periodic-table'

const ATOMIC_MASS = new Map(PERIODIC_TABLE.map(element => [element.symbol, element.atomicMass]))
const ELEMENT_SYMBOLS = new Set(ATOMIC_MASS.keys())

type Composition = Record<string, number>

function addComposition(target: Composition, source: Composition, multiplier = 1): void {
  for (const [element, count] of Object.entries(source)) {
    target[element] = (target[element] ?? 0) + count * multiplier
  }
}

function splitTopLevelHydrates(formula: string): string[] | null {
  const segments: string[] = []
  let start = 0
  let depth = 0

  for (let index = 0; index < formula.length; index += 1) {
    const character = formula[index]
    if (character === '(' || character === '[') depth += 1
    if (character === ')' || character === ']') depth -= 1
    if (depth < 0) return null

    if (character === '·' && depth === 0) {
      segments.push(formula.slice(start, index))
      start = index + 1
    }
  }

  if (depth !== 0) return null
  segments.push(formula.slice(start))
  return segments.every(Boolean) ? segments : null
}

function parseStoichiometricSegment(segment: string): Composition | null {
  let cursor = 0

  function readNumber(): number | undefined {
    const match = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(segment.slice(cursor))
    if (!match) return undefined

    const value = Number(match[0])
    if (!Number.isFinite(value) || value <= 0) return undefined
    cursor += match[0].length
    return value
  }

  function parseSequence(closingCharacter?: ')' | ']'): Composition | null {
    const composition: Composition = {}

    while (cursor < segment.length) {
      const character = segment[cursor]

      if (closingCharacter && character === closingCharacter) {
        cursor += 1
        return composition
      }

      if (character === '(' || character === '[') {
        cursor += 1
        const group = parseSequence(character === '(' ? ')' : ']')
        if (!group) return null
        addComposition(composition, group, readNumber() ?? 1)
        continue
      }

      if (character === ')' || character === ']') return null

      const elementMatch = /^[A-Z][a-z]?/.exec(segment.slice(cursor))
      if (!elementMatch || !ELEMENT_SYMBOLS.has(elementMatch[0])) return null

      cursor += elementMatch[0].length
      const count = readNumber() ?? 1
      composition[elementMatch[0]] = (composition[elementMatch[0]] ?? 0) + count
    }

    return closingCharacter ? null : composition
  }

  const composition = parseSequence()
  return composition && cursor === segment.length ? composition : null
}

/**
 * Parse a fixed-composition chemical formula.
 *
 * Supported notation includes nested parentheses/brackets, decimal
 * stoichiometry, hydrate dots and leading hydrate coefficients. A formula of
 * the form `(C2H4)n` is interpreted on a repeat-unit basis. Mixtures, ranges
 * and variable-composition formulae intentionally return `null`, because they
 * do not have one defensible molar mass.
 */
export function parseFormula(formula: string): Composition | null {
  let normalized = formula.replace(/\s+/g, '')
  if (!normalized) return null

  // Ionic charge does not change the elemental composition used by callers.
  normalized = normalized.replace(/[+-]$/, '')

  const repeatUnit = /^\((.*)\)n$/.exec(normalized)
  if (repeatUnit) {
    const unit = repeatUnit[1]
    if (!unit || unit.includes('·')) return null
    return parseStoichiometricSegment(unit)
  }

  // Any remaining lower-case stoichiometric variable means the composition
  // is not fixed (for example SLES or a copolymer with n/m fractions).
  if (/(^|[^A-Z])[nmpxyz](?=$|[^a-z])/.test(normalized)) return null

  const hydrateSegments = splitTopLevelHydrates(normalized)
  if (!hydrateSegments) return null

  const total: Composition = {}
  for (const rawSegment of hydrateSegments) {
    let segment = rawSegment
    let multiplier = 1
    const coefficient = /^(\d+(?:\.\d+)?)(?=[A-Z(\[])/.exec(segment)
    if (coefficient) {
      multiplier = Number(coefficient[1])
      segment = segment.slice(coefficient[1].length)
    }

    const composition = parseStoichiometricSegment(segment)
    if (!composition) return null
    addComposition(total, composition, multiplier)
  }

  return total
}

export function calculateMolarMass(formula: string): number | undefined {
  const composition = parseFormula(formula)
  if (!composition) return undefined

  let mass = 0
  for (const [element, count] of Object.entries(composition)) {
    const atomicMass = ATOMIC_MASS.get(element)
    if (atomicMass === undefined) return undefined
    mass += atomicMass * count
  }

  return Math.round(mass * 1000) / 1000
}
