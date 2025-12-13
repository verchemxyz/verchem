import { Compound, withMolarMass } from '../types'

const carboxylicData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'propionic-acid', name: 'Propionic Acid', formula: 'C3H6O2', category: 'carboxylic-acid', physicalState: 'liquid', boilingPoint: 141, hazards: ['H314'], uses: ['preservative', 'flavoring'] },
  { id: 'butyric-acid', name: 'Butyric Acid', formula: 'C4H8O2', category: 'carboxylic-acid', physicalState: 'liquid', boilingPoint: 164, hazards: ['H314'], uses: ['flavor', 'plasticizers'] },
  { id: 'valeric-acid', name: 'Valeric Acid', formula: 'C5H10O2', category: 'carboxylic-acid', physicalState: 'liquid', boilingPoint: 186, uses: ['fragrance', 'pharmaceuticals'] },
  { id: 'caproic-acid', name: 'Caproic Acid', formula: 'C6H12O2', category: 'carboxylic-acid', physicalState: 'liquid', boilingPoint: 205, uses: ['flavor', 'lubricants'] },
  { id: 'heptanoic-acid', name: 'Heptanoic Acid', formula: 'C7H14O2', category: 'carboxylic-acid', physicalState: 'liquid', boilingPoint: 223, uses: ['esters', 'fragrance'] },
  { id: 'octanoic-acid', name: 'Octanoic Acid', formula: 'C8H16O2', category: 'carboxylic-acid', physicalState: 'liquid', boilingPoint: 239, uses: ['antimicrobial', 'food'] },
  { id: 'nonanoic-acid', name: 'Nonanoic Acid', formula: 'C9H18O2', category: 'carboxylic-acid', physicalState: 'liquid', boilingPoint: 268, uses: ['plasticizer', 'aroma'] },
  { id: 'decanoic-acid', name: 'Decanoic Acid', formula: 'C10H20O2', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 31, boilingPoint: 268, uses: ['perfumery', 'lubricants'] },
  { id: 'lauric-acid', name: 'Lauric Acid', formula: 'C12H24O2', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 44, boilingPoint: 298, uses: ['soap', 'surfactant'] },
  { id: 'myristic-acid', name: 'Myristic Acid', formula: 'C14H28O2', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 54, uses: ['cosmetics', 'soap'] },
  { id: 'palmitic-acid', name: 'Palmitic Acid', formula: 'C16H32O2', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 63, uses: ['soap', 'food additive'] },
  { id: 'stearic-acid', name: 'Stearic Acid', formula: 'C18H36O2', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 69, uses: ['candles', 'cosmetics'] },
  { id: 'oleic-acid', name: 'Oleic Acid', formula: 'C18H34O2', category: 'carboxylic-acid', physicalState: 'liquid', meltingPoint: 13, uses: ['soaps', 'emulsifier'] },
  { id: 'linoleic-acid', name: 'Linoleic Acid', formula: 'C18H32O2', category: 'carboxylic-acid', physicalState: 'liquid', uses: ['nutrition', 'cosmetics'] },
  { id: 'benzoic-acid', name: 'Benzoic Acid', formula: 'C7H6O2', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 122, hazards: ['H319'], uses: ['preservative', 'synthesis'] },
  { id: 'salicylic-acid', name: 'Salicylic Acid', formula: 'C7H6O3', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 159, uses: ['acne treatment', 'aspirin precursor'] },
  { id: 'tartaric-acid', name: 'Tartaric Acid', formula: 'C4H6O6', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 170, uses: ['baking', 'chelating agent'] },
  { id: 'maleic-acid', name: 'Maleic Acid', formula: 'C4H4O4', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 130, hazards: ['H318'], uses: ['resins', 'copolymers'] },
  { id: 'fumaric-acid', name: 'Fumaric Acid', formula: 'C4H4O4', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 287, uses: ['food additive', 'resins'] },
  { id: 'succinic-acid', name: 'Succinic Acid', formula: 'C4H6O4', category: 'carboxylic-acid', physicalState: 'solid', meltingPoint: 185, uses: ['food additive', 'polymer precursor'] },
]

export const CARBOXYLIC_ACIDS: Compound[] = carboxylicData.map(entry => withMolarMass(entry))
