import { Compound, withMolarMass } from '../types'

const amineData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'methylamine', name: 'Methylamine', formula: 'CH5N', category: 'amine', physicalState: 'gas', boilingPoint: -6, hazards: ['H220', 'H314'], uses: ['chemical synthesis'] },
  { id: 'ethylamine', name: 'Ethylamine', formula: 'C2H7N', category: 'amine', physicalState: 'gas', boilingPoint: 16.6, hazards: ['H220', 'H314'], uses: ['pharmaceuticals', 'agrochemicals'] },
  { id: 'propylamine', name: 'Propylamine', formula: 'C3H9N', category: 'amine', physicalState: 'liquid', boilingPoint: 48, hazards: ['H226'], uses: ['intermediate'] },
  { id: 'butylamine', name: 'Butylamine', formula: 'C4H11N', category: 'amine', physicalState: 'liquid', boilingPoint: 77, hazards: ['H226'], uses: ['intermediate'] },
  { id: 'dimethylamine', name: 'Dimethylamine', formula: 'C2H7N', category: 'amine', physicalState: 'gas', boilingPoint: 7, hazards: ['H220', 'H314'], uses: ['solvents', 'rubber'] },
  { id: 'trimethylamine', name: 'Trimethylamine', formula: 'C3H9N', category: 'amine', physicalState: 'gas', boilingPoint: 3, hazards: ['H220', 'H314'], uses: ['choline synthesis'] },
  { id: 'diethylamine', name: 'Diethylamine', formula: 'C4H11N', category: 'amine', physicalState: 'liquid', boilingPoint: 55, hazards: ['H226'], uses: ['rubber chemicals'] },
  { id: 'aniline', name: 'Aniline', formula: 'C6H7N', category: 'amine', physicalState: 'liquid', boilingPoint: 184, hazards: ['H301', 'H311'], uses: ['dyes', 'rubber processing'] },
  { id: 'pyridine', name: 'Pyridine', formula: 'C5H5N', category: 'amine', physicalState: 'liquid', boilingPoint: 115, hazards: ['H225'], uses: ['solvent', 'intermediate'] },
  { id: 'piperidine', name: 'Piperidine', formula: 'C5H11N', category: 'amine', physicalState: 'liquid', boilingPoint: 106, uses: ['pharmaceuticals'] },
  { id: 'morpholine', name: 'Morpholine', formula: 'C4H9NO', category: 'amine', physicalState: 'liquid', boilingPoint: 129, uses: ['corrosion inhibitor', 'solvent'] },
  { id: 'benzylamine', name: 'Benzylamine', formula: 'C7H9N', category: 'amine', physicalState: 'liquid', boilingPoint: 185, uses: ['pharmaceuticals'] },
  { id: 'hexamethylenediamine', name: 'Hexamethylenediamine', formula: 'C6H16N2', category: 'amine', physicalState: 'solid', meltingPoint: 42, uses: ['nylon precursor'] },
  { id: 'acetamide', name: 'Acetamide', formula: 'C2H5NO', category: 'amide', physicalState: 'solid', meltingPoint: 82, uses: ['plasticizer', 'solvent'] },
  { id: 'urea', name: 'Urea', formula: 'CH4N2O', category: 'amide', physicalState: 'solid', meltingPoint: 133, uses: ['fertilizer', 'resins'] },
]

export const AMINES: Compound[] = amineData.map(entry => withMolarMass(entry))
