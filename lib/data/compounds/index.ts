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
import { GASES } from './gases'
import { SOLVENTS } from './solvents'
import { FERTILIZERS } from './fertilizers'
import { FOOD_ADDITIVES } from './food-additives'
import { NANOMATERIALS } from './nanomaterials'
import { CERAMICS } from './ceramics'
import { SURFACTANTS } from './surfactants'
import { DYES_AND_PIGMENTS } from './dyes'
import { METALS_AND_ALLOYS } from './metals'
import { POLYMERS } from './polymers'
import { ELECTRONICS_CHEMICALS } from './electronics'
import { FLAVORS_FRAGRANCES } from './flavors-fragrances'
import { AGROCHEMICALS } from './agrochemicals'
import { COSMETICS } from './cosmetics'
import { MINERALS } from './minerals'
import { RARE_EARTH_COMPOUNDS } from './rare-earths'
import { BATTERY_MATERIALS } from './battery-materials'
import { PETROCHEMICALS } from './petrochemicals'
import { AMINO_ACIDS } from './amino-acids'
import { PHARMA_EXTENDED } from './pharma-extended'
import { EXPLOSIVES_PYROTECHNICS } from './explosives-pyro'
import { LUBRICANTS } from './lubricants'
import { TEXTILE_CHEMICALS } from './textile-chemicals'
import { CONSTRUCTION_MATERIALS } from './construction'
import { CLEANING_CHEMICALS } from './cleaning'
import { PHOTOGRAPHY_CHEMICALS } from './photography'

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
  gases: GASES,
  solvents: SOLVENTS,
  fertilizers: FERTILIZERS,
  foodAdditives: FOOD_ADDITIVES,
  nanomaterials: NANOMATERIALS,
  ceramics: CERAMICS,
  surfactants: SURFACTANTS,
  dyesAndPigments: DYES_AND_PIGMENTS,
  metals: METALS_AND_ALLOYS,
  polymers: POLYMERS,
  electronics: ELECTRONICS_CHEMICALS,
  flavorsFragrances: FLAVORS_FRAGRANCES,
  agrochemicals: AGROCHEMICALS,
  cosmetics: COSMETICS,
  minerals: MINERALS,
  rareEarths: RARE_EARTH_COMPOUNDS,
  batteryMaterials: BATTERY_MATERIALS,
  petrochemicals: PETROCHEMICALS,
  aminoAcids: AMINO_ACIDS,
  pharmaExtended: PHARMA_EXTENDED,
  explosivesPyrotechnics: EXPLOSIVES_PYROTECHNICS,
  lubricants: LUBRICANTS,
  textileChemicals: TEXTILE_CHEMICALS,
  construction: CONSTRUCTION_MATERIALS,
  cleaning: CLEANING_CHEMICALS,
  photography: PHOTOGRAPHY_CHEMICALS,
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
  ...COMPOUND_GROUPS.gases,
  ...COMPOUND_GROUPS.solvents,
  ...COMPOUND_GROUPS.fertilizers,
  ...COMPOUND_GROUPS.foodAdditives,
  ...COMPOUND_GROUPS.nanomaterials,
  ...COMPOUND_GROUPS.ceramics,
  ...COMPOUND_GROUPS.surfactants,
  ...COMPOUND_GROUPS.dyesAndPigments,
  ...COMPOUND_GROUPS.metals,
  ...COMPOUND_GROUPS.polymers,
  ...COMPOUND_GROUPS.electronics,
  ...COMPOUND_GROUPS.flavorsFragrances,
  ...COMPOUND_GROUPS.agrochemicals,
  ...COMPOUND_GROUPS.cosmetics,
  ...COMPOUND_GROUPS.minerals,
  ...COMPOUND_GROUPS.rareEarths,
  ...COMPOUND_GROUPS.batteryMaterials,
  ...COMPOUND_GROUPS.petrochemicals,
  ...COMPOUND_GROUPS.aminoAcids,
  ...COMPOUND_GROUPS.pharmaExtended,
  ...COMPOUND_GROUPS.explosivesPyrotechnics,
  ...COMPOUND_GROUPS.lubricants,
  ...COMPOUND_GROUPS.textileChemicals,
  ...COMPOUND_GROUPS.construction,
  ...COMPOUND_GROUPS.cleaning,
  ...COMPOUND_GROUPS.photography,
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
