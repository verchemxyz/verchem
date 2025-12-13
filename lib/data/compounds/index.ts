import { ACIDS } from './acids'
import { BASES } from './bases'
import { BIOCHEM_COMPOUNDS } from './biochem'
import { INDUSTRIAL } from './industrial'
import { OXIDES } from './oxides'
import { PHARMACEUTICALS } from './pharma'
import { REAGENTS } from './reagents'
import { SALTS } from './salts'
import { Compound } from './types'
import { ORGANIC_COMPOUNDS } from './organic'

export const COMPOUND_GROUPS = {
  acids: ACIDS,
  bases: BASES,
  salts: SALTS,
  oxides: OXIDES,
  organic: ORGANIC_COMPOUNDS,
  biochem: BIOCHEM_COMPOUNDS,
  industrial: INDUSTRIAL,
  pharma: PHARMACEUTICALS,
  reagents: REAGENTS,
}

export const COMPREHENSIVE_COMPOUNDS: Compound[] = [
  ...COMPOUND_GROUPS.acids,
  ...COMPOUND_GROUPS.bases,
  ...COMPOUND_GROUPS.salts,
  ...COMPOUND_GROUPS.oxides,
  ...COMPOUND_GROUPS.organic,
  ...COMPOUND_GROUPS.biochem,
  ...COMPOUND_GROUPS.industrial,
  ...COMPOUND_GROUPS.pharma,
  ...COMPOUND_GROUPS.reagents,
]

export const COMMON_COMPOUNDS = COMPREHENSIVE_COMPOUNDS

export const COMPOUND_STATISTICS = {
  totalCompounds: COMPREHENSIVE_COMPOUNDS.length,
  categories: Object.fromEntries(Object.entries(COMPOUND_GROUPS).map(([key, list]) => [key, list.length])),
}

export function getAllCompounds(): Compound[] {
  return COMPREHENSIVE_COMPOUNDS
}

export function findCompoundById(id: string): Compound | undefined {
  return COMPREHENSIVE_COMPOUNDS.find(item => item.id.toLowerCase() === id.toLowerCase())
}

export function searchCompounds(query: string): Compound[] {
  const lower = query.toLowerCase()
  return COMPREHENSIVE_COMPOUNDS.filter(
    c =>
      c.name.toLowerCase().includes(lower) ||
      c.formula.toLowerCase().includes(lower) ||
      c.nameThai?.includes(lower) ||
      c.uses?.some(u => u.toLowerCase().includes(lower)) ||
      c.cas?.includes(lower) ||
      c.casNumber?.includes(lower)
  )
}
