import { Compound, withMolarMass } from '../types'

const carbonylData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'formaldehyde', name: 'Formaldehyde', formula: 'CH2O', category: 'aldehyde', physicalState: 'gas', boilingPoint: -19, hazards: ['H350', 'H301'], uses: ['resins', 'disinfectant'] },
  { id: 'acetaldehyde', name: 'Acetaldehyde', formula: 'C2H4O', category: 'aldehyde', physicalState: 'liquid', boilingPoint: 21, hazards: ['H225', 'H351'], uses: ['chemical intermediate'] },
  { id: 'propionaldehyde', name: 'Propionaldehyde', formula: 'C3H6O', category: 'aldehyde', physicalState: 'liquid', boilingPoint: 49, hazards: ['H225'], uses: ['fragrance', 'intermediate'] },
  { id: 'butyraldehyde', name: 'Butyraldehyde', formula: 'C4H8O', category: 'aldehyde', physicalState: 'liquid', boilingPoint: 75, hazards: ['H225'], uses: ['plasticizers'] },
  { id: 'benzaldehyde', name: 'Benzaldehyde', formula: 'C7H6O', category: 'aldehyde', physicalState: 'liquid', boilingPoint: 178, uses: ['flavor', 'fragrance'] },
  { id: 'acetone', name: 'Acetone', formula: 'C3H6O', category: 'ketone', physicalState: 'liquid', boilingPoint: 56, hazards: ['H225'], uses: ['solvent', 'laboratory'] },
  { id: 'methyl-ethyl-ketone', name: 'Methyl Ethyl Ketone', formula: 'C4H8O', category: 'ketone', physicalState: 'liquid', boilingPoint: 79.6, hazards: ['H225'], uses: ['solvent', 'coatings'] },
  { id: 'diethyl-ketone', name: 'Diethyl Ketone', formula: 'C5H10O', category: 'ketone', physicalState: 'liquid', boilingPoint: 102, uses: ['solvent'] },
  { id: 'methyl-isobutyl-ketone', name: 'Methyl Isobutyl Ketone', formula: 'C6H12O', category: 'ketone', physicalState: 'liquid', boilingPoint: 117, hazards: ['H226'], uses: ['solvent'] },
  { id: 'cyclohexanone', name: 'Cyclohexanone', formula: 'C6H10O', category: 'ketone', physicalState: 'liquid', boilingPoint: 156, uses: ['nylon precursor'] },
  { id: 'acetophenone', name: 'Acetophenone', formula: 'C8H8O', category: 'ketone', physicalState: 'solid', meltingPoint: 20, boilingPoint: 202, uses: ['fragrance', 'pharmaceuticals'] },
  { id: 'propiophenone', name: 'Propiophenone', formula: 'C9H10O', category: 'ketone', physicalState: 'liquid', boilingPoint: 220, uses: ['fragrance', 'synthesis'] },
  { id: 'camphor', name: 'Camphor', formula: 'C10H16O', category: 'ketone', physicalState: 'solid', meltingPoint: 175, uses: ['medicinal', 'fragrance'] },
  { id: 'acrolein', name: 'Acrolein', formula: 'C3H4O', category: 'aldehyde', physicalState: 'liquid', boilingPoint: 53, hazards: ['H330', 'H314'], uses: ['biocide', 'chemical intermediate'] },
  { id: 'crotonaldehyde', name: 'Crotonaldehyde', formula: 'C4H6O', category: 'aldehyde', physicalState: 'liquid', boilingPoint: 104, hazards: ['H301', 'H311'], uses: ['intermediate'] },
  { id: 'glyoxal', name: 'Glyoxal', formula: 'C2H2O2', category: 'aldehyde', physicalState: 'solid', meltingPoint: 15, uses: ['crosslinker', 'disinfection'] },
  { id: 'hydroxyacetone', name: 'Hydroxyacetone', formula: 'C3H6O2', category: 'ketone', physicalState: 'liquid', boilingPoint: 145, uses: ['tanning products'] },
  { id: 'cyclopentanone', name: 'Cyclopentanone', formula: 'C5H8O', category: 'ketone', physicalState: 'liquid', boilingPoint: 131, uses: ['pharmaceutical intermediate'] },
  { id: 'heptan-2-one', name: '2-Heptanone', formula: 'C7H14O', category: 'ketone', physicalState: 'liquid', boilingPoint: 151, uses: ['flavor', 'solvent'] },
  { id: 'nonan-2-one', name: '2-Nonanone', formula: 'C9H18O', category: 'ketone', physicalState: 'liquid', boilingPoint: 191, uses: ['flavor', 'solvent'] },
]

export const KETONES_AND_ALDEHYDES: Compound[] = carbonylData.map(entry => withMolarMass(entry))
