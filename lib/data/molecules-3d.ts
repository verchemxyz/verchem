// VerChem - 3D Molecular Structures Database
// Pre-built 3D coordinates for common molecules

import type { Molecule3D, Atom3D } from '@/lib/types/chemistry'

/**
 * CPK Color Scheme for Atoms
 * Standard colors used in molecular visualization
 */
export const ATOM_COLORS: Record<string, string> = {
  H: '#FFFFFF', // White
  C: '#909090', // Gray
  N: '#3050F8', // Blue
  O: '#FF0D0D', // Red
  F: '#90E050', // Light green
  Cl: '#1FF01F', // Green
  Br: '#A62929', // Dark red
  I: '#940094', // Purple
  P: '#FF8000', // Orange
  S: '#FFFF30', // Yellow
  B: '#FFB5B5', // Pink
  Na: '#AB5CF2', // Violet
  Mg: '#8AFF00', // Light green
  Al: '#BFA6A6', // Tan
  Si: '#F0C8A0', // Beige
  K: '#8F40D4', // Purple
  Ca: '#3DFF00', // Green
  Fe: '#E06633', // Orange-brown
  Cu: '#C88033', // Brown-orange
  Zn: '#7D80B0', // Blue-gray
  Ag: '#C0C0C0', // Silver
  Au: '#FFD123', // Gold
}

/**
 * Van der Waals radii (pm) for atoms
 * Used for space-filling display
 */
export const VDW_RADII: Record<string, number> = {
  H: 120,
  C: 170,
  N: 155,
  O: 152,
  F: 147,
  Cl: 175,
  Br: 185,
  I: 198,
  P: 180,
  S: 180,
  B: 192,
  Na: 227,
  Mg: 173,
  Al: 184,
  Si: 210,
  K: 275,
  Ca: 231,
  Fe: 194,
  Cu: 140,
  Zn: 139,
}

/**
 * Helper function to create atom with default properties
 */
function createAtom(
  element: string,
  x: number,
  y: number,
  z: number,
  index: number,
  charge?: number
): Atom3D {
  return {
    element,
    position: { x, y, z },
    index,
    formalCharge: charge,
    color: ATOM_COLORS[element] || '#FF00FF',
    radius: VDW_RADII[element] || 150,
  }
}

/**
 * Pre-built 3D Molecules Database
 */

// 1. Water (H2O) - Bent geometry
export const WATER: Molecule3D = {
  name: 'Water',
  formula: 'H2O',
  geometry: 'bent',
  bondAngles: [104.5],
  dipoleMoment: 1.85,
  totalCharge: 0,
  atoms: [
    createAtom('O', 0, 0, 0, 0), // Oxygen at origin
    createAtom('H', 0.757, 0.586, 0, 1), // H1
    createAtom('H', -0.757, 0.586, 0, 2), // H2
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Universal solvent, essential for life',
    uses: ['Solvent', 'Drinking water', 'Industrial processes'],
    hazards: [],
  },
}

// 2. Carbon Dioxide (CO2) - Linear
export const CARBON_DIOXIDE: Molecule3D = {
  name: 'Carbon Dioxide',
  formula: 'CO2',
  geometry: 'linear',
  bondAngles: [180],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    createAtom('C', 0, 0, 0, 0), // Carbon at origin
    createAtom('O', 1.16, 0, 0, 1), // O1 (right)
    createAtom('O', -1.16, 0, 0, 2), // O2 (left)
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 2, type: 'covalent' },
  ],
  metadata: {
    description: 'Greenhouse gas, product of combustion',
    uses: ['Carbonation', 'Fire extinguisher', 'Dry ice'],
    hazards: ['Asphyxiant'],
  },
}

// 3. Methane (CH4) - Tetrahedral
export const METHANE: Molecule3D = {
  name: 'Methane',
  formula: 'CH4',
  geometry: 'tetrahedral',
  bondAngles: [109.5],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    createAtom('C', 0, 0, 0, 0), // Carbon at origin
    createAtom('H', 0.629, 0.629, 0.629, 1), // H1
    createAtom('H', -0.629, -0.629, 0.629, 2), // H2
    createAtom('H', -0.629, 0.629, -0.629, 3), // H3
    createAtom('H', 0.629, -0.629, -0.629, 4), // H4
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 4, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Natural gas, simplest hydrocarbon',
    uses: ['Fuel', 'Chemical feedstock', 'Heating'],
    hazards: ['Flammable', 'Asphyxiant'],
  },
}

// 4. Ammonia (NH3) - Trigonal pyramidal
export const AMMONIA: Molecule3D = {
  name: 'Ammonia',
  formula: 'NH3',
  geometry: 'trigonal-pyramidal',
  bondAngles: [107.8],
  dipoleMoment: 1.42,
  totalCharge: 0,
  atoms: [
    createAtom('N', 0, 0, 0, 0), // Nitrogen at origin
    createAtom('H', 0.94, 0, 0, 1), // H1
    createAtom('H', -0.47, 0.81, 0, 2), // H2
    createAtom('H', -0.47, -0.81, 0, 3), // H3
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Pungent gas, weak base',
    uses: ['Fertilizer', 'Cleaning products', 'Chemical synthesis'],
    hazards: ['Toxic', 'Corrosive', 'Irritant'],
  },
}

// 5. Ethane (C2H6) - Staggered conformation
export const ETHANE: Molecule3D = {
  name: 'Ethane',
  formula: 'C2H6',
  geometry: 'tetrahedral',
  bondAngles: [109.5],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    createAtom('C', -0.765, 0, 0, 0), // C1
    createAtom('C', 0.765, 0, 0, 1), // C2
    createAtom('H', -1.16, 0.89, 0.51, 2), // H on C1
    createAtom('H', -1.16, -0.89, 0.51, 3),
    createAtom('H', -1.16, 0, -1.03, 4),
    createAtom('H', 1.16, 0.89, -0.51, 5), // H on C2
    createAtom('H', 1.16, -0.89, -0.51, 6),
    createAtom('H', 1.16, 0, 1.03, 7),
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' }, // C-C
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' }, // C1-H
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 5, order: 1, type: 'covalent' }, // C2-H
    { atom1Index: 1, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 7, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Component of natural gas',
    uses: ['Fuel', 'Chemical feedstock', 'Refrigerant'],
    hazards: ['Flammable', 'Asphyxiant'],
  },
}

// 6. Ethylene (C2H4) - Planar with double bond
export const ETHYLENE: Molecule3D = {
  name: 'Ethylene',
  formula: 'C2H4',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    createAtom('C', -0.665, 0, 0, 0), // C1
    createAtom('C', 0.665, 0, 0, 1), // C2
    createAtom('H', -1.23, 0.93, 0, 2), // H on C1
    createAtom('H', -1.23, -0.93, 0, 3),
    createAtom('H', 1.23, 0.93, 0, 4), // H on C2
    createAtom('H', 1.23, -0.93, 0, 5),
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' }, // C=C
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' }, // C1-H
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 4, order: 1, type: 'covalent' }, // C2-H
    { atom1Index: 1, atom2Index: 5, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Plant hormone, polyethylene precursor',
    uses: ['Polymer production', 'Fruit ripening', 'Chemical synthesis'],
    hazards: ['Flammable', 'Asphyxiant'],
  },
}

// 7. Benzene (C6H6) - Aromatic ring
export const BENZENE: Molecule3D = {
  name: 'Benzene',
  formula: 'C6H6',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    // Carbon ring (hexagon)
    createAtom('C', 1.4, 0, 0, 0),
    createAtom('C', 0.7, 1.21, 0, 1),
    createAtom('C', -0.7, 1.21, 0, 2),
    createAtom('C', -1.4, 0, 0, 3),
    createAtom('C', -0.7, -1.21, 0, 4),
    createAtom('C', 0.7, -1.21, 0, 5),
    // Hydrogens
    createAtom('H', 2.49, 0, 0, 6),
    createAtom('H', 1.24, 2.15, 0, 7),
    createAtom('H', -1.24, 2.15, 0, 8),
    createAtom('H', -2.49, 0, 0, 9),
    createAtom('H', -1.24, -2.15, 0, 10),
    createAtom('H', 1.24, -2.15, 0, 11),
  ],
  bonds: [
    // Carbon ring (alternating double bonds - resonance)
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' },
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 3, order: 2, type: 'covalent' },
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 5, order: 2, type: 'covalent' },
    { atom1Index: 5, atom2Index: 0, order: 1, type: 'covalent' },
    // C-H bonds
    { atom1Index: 0, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 9, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 10, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 11, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Aromatic hydrocarbon, carcinogenic',
    uses: ['Chemical synthesis', 'Solvent', 'Gasoline component'],
    hazards: ['Carcinogen', 'Flammable', 'Toxic'],
  },
}

// 8. Ethanol (C2H5OH) - Alcohol
export const ETHANOL: Molecule3D = {
  name: 'Ethanol',
  formula: 'C2H5OH',
  geometry: 'tetrahedral',
  bondAngles: [109.5, 104.5],
  dipoleMoment: 1.69,
  totalCharge: 0,
  atoms: [
    createAtom('C', -1.26, 0, 0, 0), // CH3
    createAtom('C', 0, 0, 0, 1), // CH2
    createAtom('O', 0.63, 1.26, 0, 2), // OH
    createAtom('H', -1.64, 0.89, 0.51, 3), // H on C1
    createAtom('H', -1.64, -0.89, 0.51, 4),
    createAtom('H', -1.64, 0, -1.03, 5),
    createAtom('H', 0.38, -0.89, 0.51, 6), // H on C2
    createAtom('H', 0.38, 0, -1.03, 7),
    createAtom('H', 1.58, 1.26, 0, 8), // H on O
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' }, // C-C
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' }, // C-O
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' }, // C1-H
    { atom1Index: 0, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 6, order: 1, type: 'covalent' }, // C2-H
    { atom1Index: 1, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 8, order: 1, type: 'covalent' }, // O-H
  ],
  metadata: {
    description: 'Drinking alcohol, intoxicant',
    uses: ['Beverages', 'Solvent', 'Fuel', 'Disinfectant'],
    hazards: ['Flammable', 'Intoxicant'],
  },
}

// 9. Acetone (CH3COCH3) - Ketone
export const ACETONE: Molecule3D = {
  name: 'Acetone',
  formula: 'C3H6O',
  geometry: 'trigonal-planar',
  bondAngles: [120, 109.5],
  dipoleMoment: 2.88,
  totalCharge: 0,
  atoms: [
    createAtom('C', 0, 0, 0, 0), // Central C
    createAtom('O', 0, 1.22, 0, 1), // C=O
    createAtom('C', -1.43, -0.63, 0, 2), // CH3 left
    createAtom('C', 1.43, -0.63, 0, 3), // CH3 right
    // H on left CH3
    createAtom('H', -1.81, -0.63, 1.03, 4),
    createAtom('H', -2.13, -0.02, -0.57, 5),
    createAtom('H', -1.43, -1.66, -0.34, 6),
    // H on right CH3
    createAtom('H', 1.81, -0.63, -1.03, 7),
    createAtom('H', 2.13, -0.02, 0.57, 8),
    createAtom('H', 1.43, -1.66, 0.34, 9),
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' }, // C=O
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' }, // C-C left
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' }, // C-C right
    // Left CH3
    { atom1Index: 2, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 6, order: 1, type: 'covalent' },
    // Right CH3
    { atom1Index: 3, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 9, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Nail polish remover, solvent',
    uses: ['Solvent', 'Cleaning', 'Chemical synthesis'],
    hazards: ['Flammable', 'Irritant'],
  },
}

// 10. Glucose (C6H12O6) - Simplified ring structure
export const GLUCOSE: Molecule3D = {
  name: 'Glucose',
  formula: 'C6H12O6',
  geometry: 'tetrahedral',
  bondAngles: [109.5],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    // Ring carbons (simplified chair conformation)
    createAtom('C', 1.4, 0, 0, 0), // C1
    createAtom('C', 0.7, 1.21, 0.5, 1), // C2
    createAtom('C', -0.7, 1.21, 0.5, 2), // C3
    createAtom('C', -1.4, 0, 0, 3), // C4
    createAtom('C', -0.7, -1.21, 0.5, 4), // C5
    createAtom('O', 0.7, -1.21, 0.5, 5), // Ring oxygen
    // OH groups
    createAtom('O', 2.5, 0, 0.5, 6), // OH on C1
    createAtom('O', 1.2, 2.2, 1, 7), // OH on C2
    createAtom('O', -1.2, 2.2, 1, 8), // OH on C3
    createAtom('O', -2.5, 0, 0.5, 9), // OH on C4
    createAtom('O', -1.2, -2.2, 1, 10), // OH on C5
    createAtom('C', -1.2, -1.21, 1.9, 11), // CH2OH on C5
    createAtom('O', -2.3, -1.21, 2.4, 12), // OH on CH2
    // Hydrogens (simplified - only on oxygens)
    createAtom('H', 3.2, 0, 0, 13), // H on O1
    createAtom('H', 1.9, 2.7, 1, 14), // H on O2
    createAtom('H', -1.9, 2.7, 1, 15), // H on O3
    createAtom('H', -3.2, 0, 0, 16), // H on O4
    createAtom('H', -1.9, -2.7, 1, 17), // H on O5
    createAtom('H', -2.9, -1.8, 2.4, 18), // H on CH2OH
  ],
  bonds: [
    // Ring
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 0, order: 1, type: 'covalent' },
    // C-OH bonds
    { atom1Index: 0, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 9, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 10, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 11, order: 1, type: 'covalent' },
    { atom1Index: 11, atom2Index: 12, order: 1, type: 'covalent' },
    // O-H bonds
    { atom1Index: 6, atom2Index: 13, order: 1, type: 'covalent' },
    { atom1Index: 7, atom2Index: 14, order: 1, type: 'covalent' },
    { atom1Index: 8, atom2Index: 15, order: 1, type: 'covalent' },
    { atom1Index: 9, atom2Index: 16, order: 1, type: 'covalent' },
    { atom1Index: 10, atom2Index: 17, order: 1, type: 'covalent' },
    { atom1Index: 12, atom2Index: 18, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Blood sugar, primary energy source',
    uses: ['Energy source', 'Medical (IV glucose)', 'Food additive'],
    hazards: [],
  },
}

/**
 * All available 3D molecules
 */
export const MOLECULES_3D: Record<string, Molecule3D> = {
  H2O: WATER,
  CO2: CARBON_DIOXIDE,
  CH4: METHANE,
  NH3: AMMONIA,
  C2H6: ETHANE,
  C2H4: ETHYLENE,
  C6H6: BENZENE,
  C2H5OH: ETHANOL,
  C3H6O: ACETONE,
  C6H12O6: GLUCOSE,
}

/**
 * Get molecule by formula
 */
export function getMolecule3D(formula: string): Molecule3D | undefined {
  return MOLECULES_3D[formula]
}

/**
 * Get all available molecule formulas
 */
export function getAvailableMolecules(): string[] {
  return Object.keys(MOLECULES_3D)
}

/**
 * Search molecules by name or formula
 */
export function searchMolecules3D(query: string): Molecule3D[] {
  const lowerQuery = query.toLowerCase()
  return Object.values(MOLECULES_3D).filter(
    (mol) =>
      mol.name.toLowerCase().includes(lowerQuery) ||
      mol.formula.toLowerCase().includes(lowerQuery)
  )
}
