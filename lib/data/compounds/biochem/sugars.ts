import { Compound, withMolarMass } from '../types'

const sugarData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'glucose', name: 'Glucose', formula: 'C6H12O6', category: 'sugar', physicalState: 'solid', uses: ['energy source', 'food'] },
  { id: 'fructose', name: 'Fructose', formula: 'C6H12O6', category: 'sugar', physicalState: 'solid', uses: ['sweetener'] },
  { id: 'galactose', name: 'Galactose', formula: 'C6H12O6', category: 'sugar', physicalState: 'solid', uses: ['biochemistry'] },
  { id: 'mannose', name: 'Mannose', formula: 'C6H12O6', category: 'sugar', physicalState: 'solid', uses: ['biochemistry'] },
  { id: 'ribose', name: 'Ribose', formula: 'C5H10O5', category: 'sugar', physicalState: 'solid', uses: ['RNA component'] },
  { id: 'deoxyribose', name: 'Deoxyribose', formula: 'C5H10O4', category: 'sugar', physicalState: 'solid', uses: ['DNA component'] },
  { id: 'xylose', name: 'Xylose', formula: 'C5H10O5', category: 'sugar', physicalState: 'solid', uses: ['wood sugar'] },
  { id: 'arabinose', name: 'Arabinose', formula: 'C5H10O5', category: 'sugar', physicalState: 'solid', uses: ['biochemistry'] },
  { id: 'sucrose', name: 'Sucrose', formula: 'C12H22O11', category: 'sugar', physicalState: 'solid', uses: ['sweetener'] },
  { id: 'lactose', name: 'Lactose', formula: 'C12H22O11', category: 'sugar', physicalState: 'solid', uses: ['dairy sugar'] },
  { id: 'maltose', name: 'Maltose', formula: 'C12H22O11', category: 'sugar', physicalState: 'solid', uses: ['malting', 'food'] },
  { id: 'trehalose', name: 'Trehalose', formula: 'C12H22O11', category: 'sugar', physicalState: 'solid', uses: ['stabilizer', 'food'] },
  { id: 'cellobiose', name: 'Cellobiose', formula: 'C12H22O11', category: 'sugar', physicalState: 'solid', uses: ['cellulose hydrolysis product'] },
  { id: 'sorbitol', name: 'Sorbitol', formula: 'C6H14O6', category: 'sugar', physicalState: 'solid', uses: ['sweetener', 'humectant'] },
  { id: 'mannitol', name: 'Mannitol', formula: 'C6H14O6', category: 'sugar', physicalState: 'solid', uses: ['diuretic', 'sweetener'] },
]

export const SUGARS: Compound[] = sugarData.map(entry => withMolarMass(entry))
