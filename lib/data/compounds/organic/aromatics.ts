import { Compound, withMolarMass } from '../types'

const aromaticData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'benzene', name: 'Benzene', formula: 'C6H6', category: 'aromatic', physicalState: 'liquid', boilingPoint: 80.1, hazards: ['H350', 'H225'], uses: ['chemical feedstock'] },
  { id: 'toluene', name: 'Toluene', formula: 'C7H8', category: 'aromatic', physicalState: 'liquid', boilingPoint: 110.6, hazards: ['H225'], uses: ['solvent', 'octane booster'] },
  { id: 'ethylbenzene', name: 'Ethylbenzene', formula: 'C8H10', category: 'aromatic', physicalState: 'liquid', boilingPoint: 136.2, hazards: ['H225'], uses: ['styrene production'] },
  { id: 'styrene', name: 'Styrene', formula: 'C8H8', category: 'aromatic', physicalState: 'liquid', boilingPoint: 145, hazards: ['H226'], uses: ['polystyrene production'] },
  { id: 'o-xylene', name: 'o-Xylene', formula: 'C8H10', category: 'aromatic', physicalState: 'liquid', boilingPoint: 144.4, hazards: ['H226'], uses: ['solvent'] },
  { id: 'm-xylene', name: 'm-Xylene', formula: 'C8H10', category: 'aromatic', physicalState: 'liquid', boilingPoint: 139.1, hazards: ['H226'], uses: ['solvent'] },
  { id: 'p-xylene', name: 'p-Xylene', formula: 'C8H10', category: 'aromatic', physicalState: 'liquid', boilingPoint: 138.4, hazards: ['H226'], uses: ['terephthalic acid precursor'] },
  { id: 'cumene', name: 'Cumene', formula: 'C9H12', category: 'aromatic', physicalState: 'liquid', boilingPoint: 152, hazards: ['H226'], uses: ['phenol production'] },
  { id: 'mesitylene', name: 'Mesitylene', formula: 'C9H12', category: 'aromatic', physicalState: 'liquid', boilingPoint: 164.7, hazards: ['H226'], uses: ['solvent'] },
  { id: 'chlorobenzene', name: 'Chlorobenzene', formula: 'C6H5Cl', category: 'aromatic', physicalState: 'liquid', boilingPoint: 132, hazards: ['H226'], uses: ['solvent', 'pesticide intermediate'] },
  { id: 'nitrobenzene', name: 'Nitrobenzene', formula: 'C6H5NO2', category: 'aromatic', physicalState: 'liquid', boilingPoint: 210.9, hazards: ['H301', 'H331'], uses: ['aniline synthesis'] },
  { id: 'phenol', name: 'Phenol', formula: 'C6H6O', category: 'aromatic', physicalState: 'solid', meltingPoint: 41, boilingPoint: 182, hazards: ['H301', 'H311'], uses: ['resins', 'antiseptic'] },
  { id: 'p-cresol', name: 'p-Cresol', formula: 'C7H8O', category: 'aromatic', physicalState: 'solid', meltingPoint: 36, boilingPoint: 202, hazards: ['H302'], uses: ['disinfectant', 'resins'] },
  { id: 'naphthalene', name: 'Naphthalene', formula: 'C10H8', category: 'aromatic', physicalState: 'solid', meltingPoint: 80, boilingPoint: 218, hazards: ['H351'], uses: ['mothballs', 'dyes'] },
  { id: 'anthracene', name: 'Anthracene', formula: 'C14H10', category: 'aromatic', physicalState: 'solid', meltingPoint: 216, boilingPoint: 340, uses: ['dyes'] },
  { id: 'phenanthrene', name: 'Phenanthrene', formula: 'C14H10', category: 'aromatic', physicalState: 'solid', meltingPoint: 101, boilingPoint: 340, uses: ['research', 'dyes'] },
  { id: 'biphenyl', name: 'Biphenyl', formula: 'C12H10', category: 'aromatic', physicalState: 'solid', meltingPoint: 69, boilingPoint: 255, uses: ['heat transfer fluid', 'dyes'] },
  { id: 'quinoline', name: 'Quinoline', formula: 'C9H7N', category: 'aromatic', physicalState: 'liquid', boilingPoint: 237, hazards: ['H302'], uses: ['pharmaceuticals'] },
  { id: 'indole', name: 'Indole', formula: 'C8H7N', category: 'aromatic', physicalState: 'solid', meltingPoint: 52, boilingPoint: 253, uses: ['fragrance', 'biochemistry'] },
  { id: 'pyrrole', name: 'Pyrrole', formula: 'C4H5N', category: 'aromatic', physicalState: 'liquid', boilingPoint: 129, uses: ['pharmaceuticals', 'conducting polymers'] },
  { id: 'fluorobenzene', name: 'Fluorobenzene', formula: 'C6H5F', category: 'aromatic', physicalState: 'liquid', boilingPoint: 85, hazards: ['H225'], uses: ['intermediate'] },
  { id: 'bromobenzene', name: 'Bromobenzene', formula: 'C6H5Br', category: 'aromatic', physicalState: 'liquid', boilingPoint: 156, uses: ['Grignard reagent precursor'] },
  { id: 'benzonitrile', name: 'Benzonitrile', formula: 'C7H5N', category: 'aromatic', physicalState: 'liquid', boilingPoint: 191, uses: ['solvent', 'intermediate'] },
  { id: 'resorcinol', name: 'Resorcinol', formula: 'C6H6O2', category: 'aromatic', physicalState: 'solid', meltingPoint: 110, uses: ['adhesives', 'medicinal'] },
  { id: 'hydroquinone', name: 'Hydroquinone', formula: 'C6H6O2', category: 'aromatic', physicalState: 'solid', meltingPoint: 173, uses: ['developer', 'antioxidant'] },
]

export const AROMATICS: Compound[] = aromaticData.map(entry => withMolarMass(entry))
