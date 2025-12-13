import { Compound, withMolarMass } from '../types'

const esterData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'methyl-formate', name: 'Methyl Formate', formula: 'C2H4O2', category: 'ester', physicalState: 'liquid', boilingPoint: 32, hazards: ['H225'], uses: ['solvent', 'fumigant'] },
  { id: 'ethyl-formate', name: 'Ethyl Formate', formula: 'C3H6O2', category: 'ester', physicalState: 'liquid', boilingPoint: 54, hazards: ['H225'], uses: ['flavor', 'solvent'] },
  { id: 'methyl-acetate', name: 'Methyl Acetate', formula: 'C3H6O2', category: 'ester', physicalState: 'liquid', boilingPoint: 57, hazards: ['H225'], uses: ['solvent', 'paint remover'] },
  { id: 'ethyl-acetate', name: 'Ethyl Acetate', formula: 'C4H8O2', category: 'ester', physicalState: 'liquid', boilingPoint: 77, hazards: ['H225'], uses: ['solvent', 'nail polish'] },
  { id: 'propyl-acetate', name: 'Propyl Acetate', formula: 'C5H10O2', category: 'ester', physicalState: 'liquid', boilingPoint: 101, hazards: ['H226'], uses: ['solvent', 'coatings'] },
  { id: 'butyl-acetate', name: 'Butyl Acetate', formula: 'C6H12O2', category: 'ester', physicalState: 'liquid', boilingPoint: 126, hazards: ['H226'], uses: ['solvent', 'coatings'] },
  { id: 'isoamyl-acetate', name: 'Isoamyl Acetate', formula: 'C7H14O2', category: 'ester', physicalState: 'liquid', boilingPoint: 142, uses: ['banana flavor', 'solvent'] },
  { id: 'ethyl-butyrate', name: 'Ethyl Butyrate', formula: 'C6H12O2', category: 'ester', physicalState: 'liquid', boilingPoint: 121, uses: ['fruit flavor', 'fragrance'] },
  { id: 'ethyl-lactate', name: 'Ethyl Lactate', formula: 'C5H10O3', category: 'ester', physicalState: 'liquid', boilingPoint: 154, uses: ['green solvent'] },
  { id: 'methyl-benzoate', name: 'Methyl Benzoate', formula: 'C8H8O2', category: 'ester', physicalState: 'liquid', boilingPoint: 199, uses: ['fragrance', 'solvent'] },
  { id: 'ethyl-benzoate', name: 'Ethyl Benzoate', formula: 'C9H10O2', category: 'ester', physicalState: 'liquid', boilingPoint: 213, uses: ['fragrance'] },
  { id: 'methyl-salicylate', name: 'Methyl Salicylate', formula: 'C8H8O3', category: 'ester', physicalState: 'liquid', boilingPoint: 223, uses: ['wintergreen oil', 'liniments'] },
  { id: 'methyl-methacrylate', name: 'Methyl Methacrylate', formula: 'C5H8O2', category: 'ester', physicalState: 'liquid', boilingPoint: 101, hazards: ['H226'], uses: ['PMMA monomer'] },
  { id: 'dimethyl-phthalate', name: 'Dimethyl Phthalate', formula: 'C10H10O4', category: 'ester', physicalState: 'liquid', boilingPoint: 282, uses: ['plasticizer', 'repellent'] },
  { id: 'diethyl-phthalate', name: 'Diethyl Phthalate', formula: 'C12H14O4', category: 'ester', physicalState: 'liquid', boilingPoint: 295, uses: ['plasticizer', 'fragrance carrier'] },
]

export const ESTERS: Compound[] = esterData.map(entry => withMolarMass(entry))
