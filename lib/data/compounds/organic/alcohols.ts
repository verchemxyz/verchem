import { Compound, withMolarMass } from '../types'

const alcoholData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'methanol', name: 'Methanol', nameThai: 'เมทานอล', formula: 'CH3OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 64.7, density: 0.79, hazards: ['H225', 'H301'], uses: ['fuel', 'solvent'] },
  { id: 'ethanol', name: 'Ethanol', nameThai: 'เอทานอล', formula: 'C2H5OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 78.4, density: 0.79, hazards: ['H225'], uses: ['beverage', 'solvent', 'fuel'] },
  { id: 'propanol-1', name: '1-Propanol', formula: 'C3H7OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 97.2, hazards: ['H225'], uses: ['solvent'] },
  { id: 'propanol-2', name: 'Isopropanol', formula: '(CH3)2CHOH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 82.6, density: 0.79, hazards: ['H225'], uses: ['disinfectant', 'solvent'] },
  { id: 'butanol-1', name: '1-Butanol', formula: 'C4H9OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 117.7, hazards: ['H226'], uses: ['solvent', 'plasticizer'] },
  { id: 'butanol-2', name: '2-Butanol', formula: 'C4H9OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 99.5, hazards: ['H226'], uses: ['solvent'] },
  { id: 'tert-butanol', name: 'tert-Butanol', formula: '(CH3)3COH', category: 'alcohol', physicalState: 'solid', meltingPoint: 25.7, boilingPoint: 82.4, hazards: ['H226'], uses: ['solvent', 'denaturant'] },
  { id: 'pentanol-1', name: '1-Pentanol', formula: 'C5H11OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 137.5, hazards: ['H226'], uses: ['solvent', 'flavor'] },
  { id: 'hexanol-1', name: '1-Hexanol', formula: 'C6H13OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 157, uses: ['solvent', 'fragrance'] },
  { id: 'heptanol-1', name: '1-Heptanol', formula: 'C7H15OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 175, uses: ['solvent', 'fragrance'] },
  { id: 'octanol-1', name: '1-Octanol', formula: 'C8H17OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 195, uses: ['solvent', 'surfactant'] },
  { id: 'nonanol-1', name: '1-Nonanol', formula: 'C9H19OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 214, uses: ['fragrance', 'solvent'] },
  { id: 'decanol-1', name: '1-Decanol', formula: 'C10H21OH', category: 'alcohol', physicalState: 'liquid', boilingPoint: 232, uses: ['surfactant', 'solvent'] },
  { id: 'ethylene-glycol', name: 'Ethylene Glycol', formula: 'C2H6O2', category: 'alcohol', physicalState: 'liquid', boilingPoint: 197, density: 1.11, hazards: ['H302'], uses: ['antifreeze', 'polyester precursor'] },
  { id: 'propylene-glycol', name: 'Propylene Glycol', formula: 'C3H8O2', category: 'alcohol', physicalState: 'liquid', boilingPoint: 188, density: 1.04, uses: ['food additive', 'solvent'] },
  { id: 'glycerol', name: 'Glycerol', formula: 'C3H8O3', category: 'alcohol', physicalState: 'liquid', meltingPoint: 18, boilingPoint: 290, density: 1.26, uses: ['humectant', 'pharmaceutical'] },
  { id: 'benzyl-alcohol', name: 'Benzyl Alcohol', formula: 'C7H8O', category: 'alcohol', physicalState: 'liquid', boilingPoint: 205, uses: ['solvent', 'preservative'] },
  { id: 'phenethyl-alcohol', name: 'Phenethyl Alcohol', formula: 'C8H10O', category: 'alcohol', physicalState: 'liquid', boilingPoint: 219, uses: ['fragrance', 'flavor'] },
  { id: 'cyclohexanol', name: 'Cyclohexanol', formula: 'C6H12O', category: 'alcohol', physicalState: 'solid', meltingPoint: 25, boilingPoint: 161, uses: ['nylon precursor'] },
  { id: 'allyl-alcohol', name: 'Allyl Alcohol', formula: 'C3H6O', category: 'alcohol', physicalState: 'liquid', boilingPoint: 97, hazards: ['H301', 'H331'], uses: ['resins', 'plasticizers'] },
]

export const ALCOHOLS: Compound[] = alcoholData.map(entry => withMolarMass(entry))
