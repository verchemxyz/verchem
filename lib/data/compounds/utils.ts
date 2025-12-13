const ATOMIC_MASS: Record<string, number> = {
  H: 1.008,
  He: 4.0026,
  Li: 6.94,
  Be: 9.0122,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Ne: 20.180,
  Na: 22.990,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Sc: 44.956,
  Ti: 47.867,
  V: 50.942,
  Cr: 51.996,
  Mn: 54.938,
  Fe: 55.845,
  Co: 58.933,
  Ni: 58.693,
  Cu: 63.546,
  Zn: 65.38,
  Ga: 69.723,
  Ge: 72.630,
  As: 74.922,
  Se: 78.971,
  Br: 79.904,
  Rb: 85.468,
  Sr: 87.62,
  Cs: 132.905,
  Ag: 107.8682,
  Cd: 112.414,
  Sn: 118.71,
  Sb: 121.760,
  I: 126.904,
  Ba: 137.327,
  Pt: 195.084,
  Au: 196.967,
  Hg: 200.592,
  Pb: 207.2,
  Bi: 208.980,
}

function parseFormula(formula: string): Record<string, number> | null {
  const tokens = formula.match(/([A-Z][a-z]?|\d+|\(|\))/g)
  if (!tokens) return null
  const stack: Array<Record<string, number>> = [{}]

  const applyCount = (target: Record<string, number>, element: string, count: number) => {
    target[element] = (target[element] ?? 0) + count
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue
    if (token === '(') {
      stack.push({})
    } else if (token === ')') {
      const group = stack.pop()
      if (!group) return null
      const multiplier = tokens[i + 1] && /^\d+$/.test(tokens[i + 1]) ? Number(tokens[i + 1]) : 1
      if (multiplier !== 1) {
        i += 1
      }
      const top = stack[stack.length - 1]
      Object.entries(group).forEach(([el, count]) => applyCount(top, el, count * multiplier))
    } else if (/^[A-Z]/.test(token)) {
      const element = token
      const next = tokens[i + 1]
      const count = next && /^\d+$/.test(next) ? Number(next) : 1
      if (count !== 1) {
        i += 1
      }
      const top = stack[stack.length - 1]
      applyCount(top, element, count)
    } else if (/^\d+$/.test(token)) {
      // standalone number should have been consumed by element or group; ignore to avoid crashes
    }
  }

  return stack.pop() ?? null
}

export function calculateMolarMass(formula: string): number | undefined {
  const normalized = formula.replace(/[\s·]/g, '')
  const composition = parseFormula(normalized)
  if (!composition) return undefined
  let mass = 0
  for (const [element, count] of Object.entries(composition)) {
    const atomic = ATOMIC_MASS[element]
    if (!atomic) return undefined
    mass += atomic * count
  }
  return Math.round(mass * 1000) / 1000
}
