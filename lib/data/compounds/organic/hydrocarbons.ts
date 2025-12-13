import { Compound, withMolarMass } from '../types'

type SeriesType = 'alkane' | 'alkene' | 'alkyne'

const alkaneNames = ['methane', 'ethane', 'propane', 'butane', 'pentane', 'hexane', 'heptane', 'octane', 'nonane', 'decane']
const alkeneNames = ['ethene', 'propene', 'butene', 'pentene', 'hexene', 'heptene', 'octene', 'nonene', 'decene']
const alkyneNames = ['ethyne', 'propyne', 'butyne', 'pentyne', 'hexyne', 'heptyne', 'octyne', 'nonyne', 'decyne']

function hydrocarbonFormula(type: SeriesType, carbonCount: number): string {
  if (type === 'alkane') return `C${carbonCount}H${2 * carbonCount + 2}`
  if (type === 'alkene') return `C${carbonCount}H${2 * carbonCount}`
  return `C${carbonCount}H${2 * carbonCount - 2}`
}

function hydrocarbonState(carbonCount: number): Compound['physicalState'] {
  if (carbonCount <= 4) return 'gas'
  if (carbonCount <= 16) return 'liquid'
  return 'solid'
}

const alkaneData: Array<Omit<Compound, 'molarMass'>> = alkaneNames.map((name, index) => {
  const carbon = index + 1
  const formula = hydrocarbonFormula('alkane', carbon)
  return {
    id: `${name}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    formula,
    category: 'hydrocarbon',
    physicalState: hydrocarbonState(carbon),
    hazards: ['H220'],
    uses: ['fuel', 'chemical feedstock'],
  }
})

const alkeneData: Array<Omit<Compound, 'molarMass'>> = alkeneNames.map((name, index) => {
  const carbon = index + 2
  const formula = hydrocarbonFormula('alkene', carbon)
  return {
    id: `${name}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    formula,
    category: 'hydrocarbon',
    physicalState: hydrocarbonState(carbon),
    hazards: ['H220'],
    uses: ['polymer feedstock', 'chemical synthesis'],
  }
})

const alkyneData: Array<Omit<Compound, 'molarMass'>> = alkyneNames.map((name, index) => {
  const carbon = index + 2
  const formula = hydrocarbonFormula('alkyne', carbon)
  return {
    id: `${name}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    formula,
    category: 'hydrocarbon',
    physicalState: hydrocarbonState(carbon),
    hazards: ['H220'],
    uses: ['welding', 'chemical synthesis'],
  }
})

const extraHydrocarbons: Array<Omit<Compound, 'molarMass'>> = [
  {
    id: 'cyclohexane',
    name: 'Cyclohexane',
    formula: 'C6H12',
    category: 'hydrocarbon',
    physicalState: 'liquid',
    boilingPoint: 81,
    hazards: ['H226'],
    uses: ['solvent', 'nylon precursor'],
  },
  {
    id: 'isoprene',
    name: 'Isoprene',
    formula: 'C5H8',
    category: 'hydrocarbon',
    physicalState: 'liquid',
    boilingPoint: 34,
    hazards: ['H225'],
    uses: ['synthetic rubber'],
  },
]

export const HYDROCARBONS: Compound[] = [...alkaneData, ...alkeneData, ...alkyneData, ...extraHydrocarbons].map(entry =>
  withMolarMass(entry)
)
