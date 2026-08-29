import type { Element } from '@/lib/types/chemistry'

export type OrbitalKind = 's' | 'p' | 'd' | 'f'

export interface SubshellOccupancy {
  name: string
  shell: number
  orbital: OrbitalKind
  electrons: number
  capacity: number
  fromNobleGasCore: boolean
}

export interface ElectronStructure {
  subshells: SubshellOccupancy[]
  shells: number[]
  totalElectrons: number
  outerShellElectrons: number
  nobleGasCore?: string
  isPredicted: boolean
}

const ORBITAL_CAPACITY: Record<OrbitalKind, number> = {
  s: 2,
  p: 6,
  d: 10,
  f: 14,
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
}

const NOBLE_GAS_CORES: Record<string, ReadonlyArray<readonly [string, number]>> = {
  He: [['1s', 2]],
  Ne: [
    ['1s', 2],
    ['2s', 2],
    ['2p', 6],
  ],
  Ar: [
    ['1s', 2],
    ['2s', 2],
    ['2p', 6],
    ['3s', 2],
    ['3p', 6],
  ],
  Kr: [
    ['1s', 2],
    ['2s', 2],
    ['2p', 6],
    ['3s', 2],
    ['3p', 6],
    ['3d', 10],
    ['4s', 2],
    ['4p', 6],
  ],
  Xe: [
    ['1s', 2],
    ['2s', 2],
    ['2p', 6],
    ['3s', 2],
    ['3p', 6],
    ['3d', 10],
    ['4s', 2],
    ['4p', 6],
    ['4d', 10],
    ['5s', 2],
    ['5p', 6],
  ],
  Rn: [
    ['1s', 2],
    ['2s', 2],
    ['2p', 6],
    ['3s', 2],
    ['3p', 6],
    ['3d', 10],
    ['4s', 2],
    ['4p', 6],
    ['4d', 10],
    ['4f', 14],
    ['5s', 2],
    ['5p', 6],
    ['5d', 10],
    ['6s', 2],
    ['6p', 6],
  ],
}

function makeSubshell(
  name: string,
  electrons: number,
  fromNobleGasCore: boolean
): SubshellOccupancy {
  const match = /^(\d)([spdf])$/.exec(name)
  if (!match) {
    throw new Error(`Unsupported subshell ${name}`)
  }

  const shell = Number(match[1])
  const orbital = match[2] as OrbitalKind
  const capacity = ORBITAL_CAPACITY[orbital]

  if (!Number.isInteger(electrons) || electrons < 1 || electrons > capacity) {
    throw new Error(`Invalid occupancy ${name}${electrons}`)
  }

  return { name, shell, orbital, electrons, capacity, fromNobleGasCore }
}

function superscriptToNumber(value: string): number {
  const digits = [...value].map((digit) => SUPERSCRIPT_DIGITS[digit]).join('')
  const parsed = Number(digits)

  if (!digits || !Number.isInteger(parsed)) {
    throw new Error(`Invalid superscript electron count ${value}`)
  }

  return parsed
}

export function parseElectronStructure(element: Element): ElectronStructure {
  const configuration = element.electronConfiguration.trim()
  const nobleGasMatch = /^\[([A-Z][a-z]?)\]/.exec(configuration)
  const nobleGasCore = nobleGasMatch?.[1]
  const coreEntries = nobleGasCore ? NOBLE_GAS_CORES[nobleGasCore] : undefined

  if (nobleGasCore && !coreEntries) {
    throw new Error(`Unknown noble-gas core [${nobleGasCore}] for ${element.symbol}`)
  }

  const subshells: SubshellOccupancy[] = (coreEntries ?? []).map(([name, electrons]) =>
    makeSubshell(name, electrons, true)
  )
  const explicitConfiguration = nobleGasMatch
    ? configuration.slice(nobleGasMatch[0].length)
    : configuration
  const matches = [
    ...explicitConfiguration.matchAll(/(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g),
  ]

  if (matches.length === 0) {
    throw new Error(`No subshells found for ${element.symbol}: ${configuration}`)
  }

  for (const match of matches) {
    const name = `${match[1]}${match[2]}`
    if (subshells.some((subshell) => subshell.name === name)) {
      throw new Error(`Duplicate subshell ${name} for ${element.symbol}`)
    }
    subshells.push(makeSubshell(name, superscriptToNumber(match[3]), false))
  }

  const shells = Array.from({ length: 7 }, () => 0)
  for (const subshell of subshells) {
    shells[subshell.shell - 1] += subshell.electrons
  }

  while (shells.at(-1) === 0) shells.pop()

  const totalElectrons = shells.reduce((sum, electrons) => sum + electrons, 0)
  if (totalElectrons !== element.atomicNumber) {
    throw new Error(
      `${element.symbol} electron configuration totals ${totalElectrons}; expected Z=${element.atomicNumber}`
    )
  }

  return {
    subshells,
    shells,
    totalElectrons,
    outerShellElectrons: shells.at(-1) ?? 0,
    nobleGasCore,
    // NIST ASD ground-state coverage currently reaches Hs (Z=108). The
    // configurations shown for Mt-Og are theoretical predictions.
    isPredicted: element.atomicNumber > 108,
  }
}

