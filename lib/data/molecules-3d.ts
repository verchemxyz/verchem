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

// 10. Acetylene (C2H2) - Linear with triple bond
export const ACETYLENE: Molecule3D = {
  name: 'Acetylene',
  formula: 'C2H2',
  geometry: 'linear',
  bondAngles: [180],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    createAtom('C', -0.6, 0, 0, 0), // C1
    createAtom('C', 0.6, 0, 0, 1), // C2
    createAtom('H', -1.66, 0, 0, 2), // H1
    createAtom('H', 1.66, 0, 0, 3), // H2
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 3, type: 'covalent' }, // C≡C
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 3, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Welding gas, simplest alkyne',
    uses: ['Welding', 'Chemical synthesis', 'Fuel'],
    hazards: ['Extremely flammable', 'Asphyxiant', 'Explosive'],
  },
}

// 11. Propane (C3H8) - Alkane
export const PROPANE: Molecule3D = {
  name: 'Propane',
  formula: 'C3H8',
  geometry: 'tetrahedral',
  bondAngles: [109.5],
  dipoleMoment: 0,
  totalCharge: 0,
  atoms: [
    createAtom('C', -1.27, 0, 0, 0), // C1
    createAtom('C', 0, 0, 0, 1), // C2 (middle)
    createAtom('C', 1.27, 0, 0, 2), // C3
    // H on C1
    createAtom('H', -1.65, 0.89, 0.51, 3),
    createAtom('H', -1.65, -0.89, 0.51, 4),
    createAtom('H', -1.65, 0, -1.03, 5),
    // H on C2
    createAtom('H', 0, 0.89, -0.51, 6),
    createAtom('H', 0, -0.89, -0.51, 7),
    // H on C3
    createAtom('H', 1.65, 0.89, -0.51, 8),
    createAtom('H', 1.65, -0.89, -0.51, 9),
    createAtom('H', 1.65, 0, 1.03, 10),
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' }, // C-C
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' }, // C-C
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 9, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 10, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'LPG, common fuel gas',
    uses: ['Fuel', 'Heating', 'Cooking', 'Refrigerant'],
    hazards: ['Extremely flammable', 'Asphyxiant'],
  },
}

// 12. Formaldehyde (CH2O) - Planar
export const FORMALDEHYDE: Molecule3D = {
  name: 'Formaldehyde',
  formula: 'CH2O',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 2.33,
  totalCharge: 0,
  atoms: [
    createAtom('C', 0, 0, 0, 0), // C
    createAtom('O', 1.22, 0, 0, 1), // O (double bond)
    createAtom('H', -0.57, 0.93, 0, 2), // H1
    createAtom('H', -0.57, -0.93, 0, 3), // H2
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' }, // C=O
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Simplest aldehyde, preservative',
    uses: ['Disinfectant', 'Preservative', 'Chemical synthesis'],
    hazards: ['Toxic', 'Carcinogen', 'Irritant'],
  },
}

// 13. Acetic Acid (CH3COOH) - Carboxylic acid
export const ACETIC_ACID: Molecule3D = {
  name: 'Acetic Acid',
  formula: 'CH3COOH',
  geometry: 'tetrahedral',
  bondAngles: [109.5, 120],
  dipoleMoment: 1.74,
  totalCharge: 0,
  atoms: [
    createAtom('C', -0.76, 0, 0, 0), // CH3
    createAtom('C', 0.76, 0, 0, 1), // COOH
    createAtom('O', 1.35, 1.08, 0, 2), // C=O
    createAtom('O', 1.35, -1.08, 0, 3), // C-OH
    createAtom('H', 2.31, -1.08, 0, 4), // H on OH
    // H on CH3
    createAtom('H', -1.16, 0.89, 0.51, 5),
    createAtom('H', -1.16, -0.89, 0.51, 6),
    createAtom('H', -1.16, 0, -1.03, 7),
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' }, // C-C
    { atom1Index: 1, atom2Index: 2, order: 2, type: 'covalent' }, // C=O
    { atom1Index: 1, atom2Index: 3, order: 1, type: 'covalent' }, // C-OH
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' }, // O-H
    { atom1Index: 0, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 7, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Vinegar, weak acid',
    uses: ['Food preservative', 'Cleaning', 'Chemical synthesis'],
    hazards: ['Corrosive', 'Irritant'],
  },
}

// 14. Hydrogen Peroxide (H2O2) - Non-planar
export const HYDROGEN_PEROXIDE: Molecule3D = {
  name: 'Hydrogen Peroxide',
  formula: 'H2O2',
  geometry: 'bent',
  bondAngles: [94.8],
  dipoleMoment: 2.26,
  totalCharge: 0,
  atoms: [
    createAtom('O', -0.73, 0, 0, 0), // O1
    createAtom('O', 0.73, 0, 0, 1), // O2
    createAtom('H', -0.97, 0.82, 0.43, 2), // H1
    createAtom('H', 0.97, -0.82, 0.43, 3), // H2
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' }, // O-O
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 3, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Bleach, antiseptic, oxidizer',
    uses: ['Bleaching', 'Disinfectant', 'Rocket propellant'],
    hazards: ['Oxidizer', 'Corrosive', 'Irritant'],
  },
}

// 15. Sulfur Dioxide (SO2) - Bent
export const SULFUR_DIOXIDE: Molecule3D = {
  name: 'Sulfur Dioxide',
  formula: 'SO2',
  geometry: 'bent',
  bondAngles: [119],
  dipoleMoment: 1.63,
  totalCharge: 0,
  atoms: [
    createAtom('S', 0, 0, 0, 0), // S at origin
    createAtom('O', 1.43, 0.52, 0, 1), // O1
    createAtom('O', -1.43, 0.52, 0, 2), // O2
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 2, type: 'covalent' },
  ],
  metadata: {
    description: 'Acid rain precursor, preservative',
    uses: ['Preservative', 'Bleaching', 'Refrigerant'],
    hazards: ['Toxic', 'Corrosive', 'Irritant'],
  },
}

// 16. Nitrogen Dioxide (NO2) - Bent, radical
export const NITROGEN_DIOXIDE: Molecule3D = {
  name: 'Nitrogen Dioxide',
  formula: 'NO2',
  geometry: 'bent',
  bondAngles: [134],
  dipoleMoment: 0.32,
  totalCharge: 0,
  atoms: [
    createAtom('N', 0, 0, 0, 0), // N at origin
    createAtom('O', 1.19, 0.49, 0, 1), // O1
    createAtom('O', -1.19, 0.49, 0, 2), // O2
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 2, type: 'covalent' },
  ],
  metadata: {
    description: 'Air pollutant, brown gas',
    uses: ['Nitric acid production', 'Oxidizer'],
    hazards: ['Toxic', 'Corrosive', 'Oxidizer'],
  },
}

// 17. Hydrogen Sulfide (H2S) - Bent
export const HYDROGEN_SULFIDE: Molecule3D = {
  name: 'Hydrogen Sulfide',
  formula: 'H2S',
  geometry: 'bent',
  bondAngles: [92.1],
  dipoleMoment: 0.97,
  totalCharge: 0,
  atoms: [
    createAtom('S', 0, 0, 0, 0), // S at origin
    createAtom('H', 0.96, 0.67, 0, 1), // H1
    createAtom('H', -0.96, 0.67, 0, 2), // H2
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Rotten egg smell, toxic gas',
    uses: ['Chemical synthesis', 'Analytical chemistry'],
    hazards: ['Extremely toxic', 'Flammable', 'Corrosive'],
  },
}

// 18. Phosphine (PH3) - Trigonal pyramidal
export const PHOSPHINE: Molecule3D = {
  name: 'Phosphine',
  formula: 'PH3',
  geometry: 'trigonal-pyramidal',
  bondAngles: [93.5],
  dipoleMoment: 0.58,
  totalCharge: 0,
  atoms: [
    createAtom('P', 0, 0, 0, 0), // P at origin
    createAtom('H', 1.42, 0, 0, 1), // H1
    createAtom('H', -0.71, 1.23, 0, 2), // H2
    createAtom('H', -0.71, -1.23, 0, 3), // H3
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Toxic gas, semiconductor dopant',
    uses: ['Semiconductor doping', 'Chemical synthesis'],
    hazards: ['Extremely toxic', 'Flammable', 'Spontaneously combustible'],
  },
}

// 19. Hydrochloric Acid (HCl) - Linear diatomic
export const HYDROCHLORIC_ACID: Molecule3D = {
  name: 'Hydrochloric Acid',
  formula: 'HCl',
  geometry: 'linear',
  bondAngles: [],
  dipoleMoment: 1.08,
  totalCharge: 0,
  atoms: [
    createAtom('H', -0.64, 0, 0, 0), // H
    createAtom('Cl', 0.64, 0, 0, 1), // Cl
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Strong acid, stomach acid',
    uses: ['Chemical synthesis', 'Cleaning', 'Metal processing'],
    hazards: ['Corrosive', 'Toxic', 'Irritant'],
  },
}

// 20. Nitric Acid (HNO3) - Planar
export const NITRIC_ACID: Molecule3D = {
  name: 'Nitric Acid',
  formula: 'HNO3',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 2.17,
  totalCharge: 0,
  atoms: [
    createAtom('N', 0, 0, 0, 0), // N at origin
    createAtom('O', 1.21, 0, 0, 1), // O (double bond)
    createAtom('O', -0.61, 1.05, 0, 2), // O-H
    createAtom('O', -0.61, -1.05, 0, 3), // O (single)
    createAtom('H', -0.85, 1.96, 0, 4), // H on OH
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' }, // N=O
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' }, // N-OH
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' }, // N-O
    { atom1Index: 2, atom2Index: 4, order: 1, type: 'covalent' }, // O-H
  ],
  metadata: {
    description: 'Strong oxidizing acid',
    uses: ['Fertilizer production', 'Explosives', 'Metal etching'],
    hazards: ['Corrosive', 'Oxidizer', 'Toxic'],
  },
}

// 21. Methanol (CH3OH) - Simple alcohol
export const METHANOL: Molecule3D = {
  name: 'Methanol',
  formula: 'CH3OH',
  geometry: 'tetrahedral',
  bondAngles: [109.5],
  dipoleMoment: 1.7,
  totalCharge: 0,
  atoms: [
    createAtom('C', 0, 0, 0, 0), // C at origin
    createAtom('O', 1.43, 0, 0, 1), // O
    createAtom('H', 1.85, 0.94, 0, 2), // H on O
    createAtom('H', -0.36, 0.89, 0.51, 3), // H on C
    createAtom('H', -0.36, -0.89, 0.51, 4), // H on C
    createAtom('H', -0.36, 0, -1.03, 5), // H on C
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' }, // C-O
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' }, // O-H
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 5, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Wood alcohol, simplest alcohol',
    uses: ['Solvent', 'Fuel', 'Antifreeze'],
    hazards: ['Toxic', 'Flammable', 'Causes blindness'],
  },
}

// 22. Urea (CH4N2O) - Fertilizer
export const UREA: Molecule3D = {
  name: 'Urea',
  formula: 'CH4N2O',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 4.56,
  totalCharge: 0,
  atoms: [
    createAtom('C', 0, 0, 0, 0), // C at origin
    createAtom('O', 0, 1.25, 0, 1), // O (double bond)
    createAtom('N', -1.14, -0.62, 0, 2), // N left
    createAtom('N', 1.14, -0.62, 0, 3), // N right
    // H on left N
    createAtom('H', -1.14, -1.62, 0, 4),
    createAtom('H', -2.0, -0.15, 0, 5),
    // H on right N
    createAtom('H', 1.14, -1.62, 0, 6),
    createAtom('H', 2.0, -0.15, 0, 7),
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' }, // C=O
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' }, // C-N
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' }, // C-N
    { atom1Index: 2, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 7, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Most common nitrogen fertilizer',
    uses: ['Fertilizer', 'Animal feed', 'Plastics production'],
    hazards: [],
  },
}

// 23. Toluene (C7H8) - Aromatic hydrocarbon
export const TOLUENE: Molecule3D = {
  name: 'Toluene',
  formula: 'C7H8',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 0.36,
  totalCharge: 0,
  atoms: [
    // Benzene ring
    createAtom('C', 1.4, 0, 0, 0),
    createAtom('C', 0.7, 1.21, 0, 1),
    createAtom('C', -0.7, 1.21, 0, 2),
    createAtom('C', -1.4, 0, 0, 3),
    createAtom('C', -0.7, -1.21, 0, 4),
    createAtom('C', 0.7, -1.21, 0, 5),
    // CH3 group on C1
    createAtom('C', 2.9, 0, 0, 6),
    // H on benzene ring
    createAtom('H', 1.24, 2.15, 0, 7),
    createAtom('H', -1.24, 2.15, 0, 8),
    createAtom('H', -2.49, 0, 0, 9),
    createAtom('H', -1.24, -2.15, 0, 10),
    createAtom('H', 1.24, -2.15, 0, 11),
    // H on CH3
    createAtom('H', 3.28, 0.89, 0.51, 12),
    createAtom('H', 3.28, -0.89, 0.51, 13),
    createAtom('H', 3.28, 0, -1.03, 14),
  ],
  bonds: [
    // Ring
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' },
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 3, order: 2, type: 'covalent' },
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 5, order: 2, type: 'covalent' },
    { atom1Index: 5, atom2Index: 0, order: 1, type: 'covalent' },
    // CH3 attachment
    { atom1Index: 0, atom2Index: 6, order: 1, type: 'covalent' },
    // Ring H
    { atom1Index: 1, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 9, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 10, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 11, order: 1, type: 'covalent' },
    // CH3 H
    { atom1Index: 6, atom2Index: 12, order: 1, type: 'covalent' },
    { atom1Index: 6, atom2Index: 13, order: 1, type: 'covalent' },
    { atom1Index: 6, atom2Index: 14, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Solvent, paint thinner, octane booster',
    uses: ['Solvent', 'Chemical synthesis', 'Gasoline additive'],
    hazards: ['Flammable', 'Neurotoxic', 'Irritant'],
  },
}

// 24. Aspirin (C9H8O4) - Common medicine
export const ASPIRIN: Molecule3D = {
  name: 'Aspirin',
  formula: 'C9H8O4',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 2.7,
  totalCharge: 0,
  atoms: [
    // Benzene ring
    createAtom('C', 0, 0, 0, 0),
    createAtom('C', 1.4, 0, 0, 1),
    createAtom('C', 2.1, 1.21, 0, 2),
    createAtom('C', 1.4, 2.42, 0, 3),
    createAtom('C', 0, 2.42, 0, 4),
    createAtom('C', -0.7, 1.21, 0, 5),
    // COOH group
    createAtom('C', -2.2, 1.21, 0, 6), // COOH carbon
    createAtom('O', -2.79, 2.29, 0, 7), // C=O
    createAtom('O', -2.79, 0.13, 0, 8), // C-OH
    createAtom('H', -3.75, 0.13, 0, 9), // H on OH
    // Acetyl group (-OCOCH3)
    createAtom('O', 2.1, -1.08, 0, 10), // O on benzene
    createAtom('C', 3.5, -1.08, 0, 11), // C=O
    createAtom('O', 4.2, -2.1, 0, 12), // C=O oxygen
    createAtom('C', 4.2, 0.14, 0, 13), // CH3
    // H on benzene
    createAtom('H', 3.17, 1.21, 0, 14),
    createAtom('H', 1.93, 3.36, 0, 15),
    createAtom('H', -0.53, 3.36, 0, 16),
    // H on CH3
    createAtom('H', 4.2, 0.74, 0.9, 17),
    createAtom('H', 4.2, 0.74, -0.9, 18),
    createAtom('H', 5.2, -0.2, 0, 19),
  ],
  bonds: [
    // Ring
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' },
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 3, order: 2, type: 'covalent' },
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 5, order: 2, type: 'covalent' },
    { atom1Index: 5, atom2Index: 0, order: 1, type: 'covalent' },
    // COOH
    { atom1Index: 5, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 6, atom2Index: 7, order: 2, type: 'covalent' },
    { atom1Index: 6, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 8, atom2Index: 9, order: 1, type: 'covalent' },
    // Acetyl
    { atom1Index: 1, atom2Index: 10, order: 1, type: 'covalent' },
    { atom1Index: 10, atom2Index: 11, order: 1, type: 'covalent' },
    { atom1Index: 11, atom2Index: 12, order: 2, type: 'covalent' },
    { atom1Index: 11, atom2Index: 13, order: 1, type: 'covalent' },
    // Ring H
    { atom1Index: 2, atom2Index: 14, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 15, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 16, order: 1, type: 'covalent' },
    // CH3 H
    { atom1Index: 13, atom2Index: 17, order: 1, type: 'covalent' },
    { atom1Index: 13, atom2Index: 18, order: 1, type: 'covalent' },
    { atom1Index: 13, atom2Index: 19, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Pain reliever, anti-inflammatory, blood thinner',
    uses: ['Pain relief', 'Fever reduction', 'Heart attack prevention'],
    hazards: ['Stomach irritation', 'Bleeding risk'],
  },
}

// 25. Caffeine (C8H10N4O2) - Stimulant
export const CAFFEINE: Molecule3D = {
  name: 'Caffeine',
  formula: 'C8H10N4O2',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 3.64,
  totalCharge: 0,
  atoms: [
    // Central ring system (simplified)
    createAtom('C', 0, 0, 0, 0),
    createAtom('N', 1.4, 0, 0, 1),
    createAtom('C', 2.1, 1.21, 0, 2),
    createAtom('N', 1.4, 2.42, 0, 3),
    createAtom('C', 0, 2.42, 0, 4),
    createAtom('C', -0.7, 1.21, 0, 5), // Connects back
    // Second ring
    createAtom('N', -0.7, 3.63, 0, 6),
    createAtom('C', 0.7, 3.63, 0, 7),
    createAtom('N', 1.4, 4.84, 0, 8),
    // Oxygen atoms
    createAtom('O', -1.77, 1.21, 0, 9), // C=O
    createAtom('O', 3.37, 1.21, 0, 10), // C=O
    // CH3 groups
    createAtom('C', 2.8, 4.84, 0, 11), // CH3 on N
    createAtom('C', 2.8, -0.62, 0, 12), // CH3 on N
    createAtom('C', -2.1, 3.63, 0, 13), // CH3 on N
    // H on CH3 groups (simplified - only one per CH3)
    createAtom('H', 3.18, 5.74, 0, 14),
    createAtom('H', 3.18, -1.52, 0, 15),
    createAtom('H', -2.48, 4.53, 0, 16),
  ],
  bonds: [
    // Main ring
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 0, order: 2, type: 'covalent' },
    // Second ring
    { atom1Index: 4, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 6, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 7, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 7, atom2Index: 8, order: 2, type: 'covalent' },
    // Oxygens
    { atom1Index: 5, atom2Index: 9, order: 2, type: 'covalent' },
    { atom1Index: 2, atom2Index: 10, order: 2, type: 'covalent' },
    // CH3 groups
    { atom1Index: 8, atom2Index: 11, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 12, order: 1, type: 'covalent' },
    { atom1Index: 6, atom2Index: 13, order: 1, type: 'covalent' },
    // H on CH3
    { atom1Index: 11, atom2Index: 14, order: 1, type: 'covalent' },
    { atom1Index: 12, atom2Index: 15, order: 1, type: 'covalent' },
    { atom1Index: 13, atom2Index: 16, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Stimulant found in coffee, tea, energy drinks',
    uses: ['Beverage ingredient', 'Pharmaceutical', 'Cognitive enhancement'],
    hazards: ['Addictive', 'Anxiety at high doses', 'Insomnia'],
  },
}

// 26. Glycerol (C3H8O3) - Trihydroxy alcohol
export const GLYCEROL: Molecule3D = {
  name: 'Glycerol',
  formula: 'C3H8O3',
  geometry: 'tetrahedral',
  bondAngles: [109.5],
  dipoleMoment: 2.56,
  totalCharge: 0,
  atoms: [
    // Carbon chain
    createAtom('C', 0, 0, 0, 0),
    createAtom('C', 1.54, 0, 0, 1),
    createAtom('C', 2.31, 1.29, 0, 2),
    // OH groups
    createAtom('O', -0.36, 1.31, 0, 3), // OH on C1
    createAtom('O', 1.9, -1.31, 0, 4), // OH on C2
    createAtom('O', 3.71, 1.29, 0, 5), // OH on C3
    // H on carbons
    createAtom('H', -0.36, -0.89, 0.51, 6),
    createAtom('H', -0.36, -0.89, -0.51, 7),
    createAtom('H', 1.9, 0.36, 1.03, 8),
    createAtom('H', 1.95, 2.18, 0.51, 9),
    createAtom('H', 1.95, 2.18, -0.51, 10),
    // H on OH groups
    createAtom('H', -0.74, 2.2, 0, 11),
    createAtom('H', 2.28, -2.2, 0, 12),
    createAtom('H', 4.09, 2.18, 0, 13),
  ],
  bonds: [
    // C-C bonds
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    // C-O bonds
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 5, order: 1, type: 'covalent' },
    // C-H bonds
    { atom1Index: 0, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 9, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 10, order: 1, type: 'covalent' },
    // O-H bonds
    { atom1Index: 3, atom2Index: 11, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 12, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 13, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Sweet-tasting trihydroxy alcohol, used in cosmetics and food',
    uses: ['Moisturizer', 'Food additive', 'Pharmaceutical', 'Antifreeze'],
    hazards: [],
  },
}

// 27. Phenol (C6H5OH) - Aromatic alcohol
export const PHENOL: Molecule3D = {
  name: 'Phenol',
  formula: 'C6H5OH',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 1.45,
  totalCharge: 0,
  atoms: [
    // Benzene ring
    createAtom('C', 1.4, 0, 0, 0),
    createAtom('C', 0.7, 1.21, 0, 1),
    createAtom('C', -0.7, 1.21, 0, 2),
    createAtom('C', -1.4, 0, 0, 3),
    createAtom('C', -0.7, -1.21, 0, 4),
    createAtom('C', 0.7, -1.21, 0, 5),
    // OH group on C1
    createAtom('O', 2.8, 0, 0, 6),
    createAtom('H', 3.18, 0.94, 0, 7), // H on OH
    // H on benzene ring
    createAtom('H', 1.24, 2.15, 0, 8),
    createAtom('H', -1.24, 2.15, 0, 9),
    createAtom('H', -2.49, 0, 0, 10),
    createAtom('H', -1.24, -2.15, 0, 11),
    createAtom('H', 1.24, -2.15, 0, 12),
  ],
  bonds: [
    // Ring
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' },
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 3, order: 2, type: 'covalent' },
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 5, order: 2, type: 'covalent' },
    { atom1Index: 5, atom2Index: 0, order: 1, type: 'covalent' },
    // OH attachment
    { atom1Index: 0, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 6, atom2Index: 7, order: 1, type: 'covalent' },
    // Ring H
    { atom1Index: 1, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 2, atom2Index: 9, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 10, order: 1, type: 'covalent' },
    { atom1Index: 4, atom2Index: 11, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 12, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Aromatic alcohol, antiseptic, precursor to plastics',
    uses: ['Disinfectant', 'Precursor to plastics', 'Chemical synthesis'],
    hazards: ['Corrosive', 'Toxic', 'Burns skin'],
  },
}

// 28. Acetaldehyde (C2H4O) - Simple aldehyde
export const ACETALDEHYDE: Molecule3D = {
  name: 'Acetaldehyde',
  formula: 'C2H4O',
  geometry: 'trigonal-planar',
  bondAngles: [120],
  dipoleMoment: 2.7,
  totalCharge: 0,
  atoms: [
    // Carbonyl carbon
    createAtom('C', 0, 0, 0, 0),
    createAtom('O', 0, 1.22, 0, 1), // C=O
    createAtom('H', 1.0, -0.6, 0, 2), // H on carbonyl C
    // CH3 group
    createAtom('C', -1.43, -0.5, 0, 3),
    createAtom('H', -1.43, -1.1, 0.9, 4),
    createAtom('H', -1.43, -1.1, -0.9, 5),
    createAtom('H', -2.36, 0.1, 0, 6),
  ],
  bonds: [
    { atom1Index: 0, atom2Index: 1, order: 2, type: 'covalent' }, // C=O
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 6, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Simple aldehyde, alcohol metabolism product',
    uses: ['Chemical intermediate', 'Flavor compound'],
    hazards: ['Flammable', 'Irritant', 'Carcinogenic'],
  },
}

// 29. Ethylene Glycol (C2H6O2) - Antifreeze
export const ETHYLENE_GLYCOL: Molecule3D = {
  name: 'Ethylene Glycol',
  formula: 'C2H6O2',
  geometry: 'tetrahedral',
  bondAngles: [109.5],
  dipoleMoment: 2.28,
  totalCharge: 0,
  atoms: [
    // Carbon chain
    createAtom('C', 0, 0, 0, 0),
    createAtom('C', 1.54, 0, 0, 1),
    // OH groups
    createAtom('O', -0.36, 1.31, 0, 2), // OH on C1
    createAtom('O', 1.9, -1.31, 0, 3), // OH on C2
    // H on carbons
    createAtom('H', -0.36, -0.89, 0.51, 4),
    createAtom('H', -0.36, -0.89, -0.51, 5),
    createAtom('H', 1.9, 0.36, 1.03, 6),
    createAtom('H', 1.9, 0.36, -1.03, 7),
    // H on OH groups
    createAtom('H', -0.74, 2.2, 0, 8),
    createAtom('H', 2.28, -2.2, 0, 9),
  ],
  bonds: [
    // C-C bond
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    // C-O bonds
    { atom1Index: 0, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 3, order: 1, type: 'covalent' },
    // C-H bonds
    { atom1Index: 0, atom2Index: 4, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 5, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 7, order: 1, type: 'covalent' },
    // O-H bonds
    { atom1Index: 2, atom2Index: 8, order: 1, type: 'covalent' },
    { atom1Index: 3, atom2Index: 9, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Antifreeze, coolant, deicing fluid',
    uses: ['Antifreeze', 'Coolant', 'Deicing', 'Polyester production'],
    hazards: ['Toxic', 'Sweet taste attracts animals', 'Kidney damage'],
  },
}

// 30. Dimethyl Ether (C2H6O) - Simple ether
export const DIMETHYL_ETHER: Molecule3D = {
  name: 'Dimethyl Ether',
  formula: 'C2H6O',
  geometry: 'bent',
  bondAngles: [111.7],
  dipoleMoment: 1.3,
  totalCharge: 0,
  atoms: [
    // Central oxygen
    createAtom('O', 0, 0, 0, 0),
    // First CH3
    createAtom('C', -1.43, 0, 0, 1),
    createAtom('H', -1.79, 0.89, 0.51, 2),
    createAtom('H', -1.79, -0.89, 0.51, 3),
    createAtom('H', -1.79, 0, -1.03, 4),
    // Second CH3
    createAtom('C', 1.43, 0, 0, 5),
    createAtom('H', 1.79, 0.89, 0.51, 6),
    createAtom('H', 1.79, -0.89, 0.51, 7),
    createAtom('H', 1.79, 0, -1.03, 8),
  ],
  bonds: [
    // C-O-C
    { atom1Index: 0, atom2Index: 1, order: 1, type: 'covalent' },
    { atom1Index: 0, atom2Index: 5, order: 1, type: 'covalent' },
    // First CH3
    { atom1Index: 1, atom2Index: 2, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 3, order: 1, type: 'covalent' },
    { atom1Index: 1, atom2Index: 4, order: 1, type: 'covalent' },
    // Second CH3
    { atom1Index: 5, atom2Index: 6, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 7, order: 1, type: 'covalent' },
    { atom1Index: 5, atom2Index: 8, order: 1, type: 'covalent' },
  ],
  metadata: {
    description: 'Simplest ether, propellant, potential diesel fuel',
    uses: ['Aerosol propellant', 'Refrigerant', 'Fuel additive'],
    hazards: ['Highly flammable', 'Pressurized gas', 'Asphyxiant'],
  },
}

/**
 * Molecule categories for organization
 */
export const MOLECULE_CATEGORIES = {
  'Basic Molecules': ['H2O', 'CO2', 'NH3', 'H2O2'],
  'Hydrocarbons': ['CH4', 'C2H6', 'C2H4', 'C2H2', 'C3H8', 'C6H6', 'C7H8'],
  'Alcohols & Organic': ['CH3OH', 'C2H5OH', 'C3H8O3', 'C2H6O2', 'C6H5OH', 'C3H6O', 'CH2O', 'C2H4O', 'CH3COOH'],
  'Acids & Bases': ['HCl', 'HNO3', 'CH3COOH', 'NH3'],
  'Inorganic': ['SO2', 'NO2', 'H2S', 'PH3'],
  'Biological': ['C6H12O6', 'CH4N2O', 'C8H10N4O2', 'C9H8O4'],
  'Others': ['C2H6O_ether'],
} as const

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
  C2H2: ACETYLENE,
  C3H8: PROPANE,
  CH2O: FORMALDEHYDE,
  CH3COOH: ACETIC_ACID,
  H2O2: HYDROGEN_PEROXIDE,
  SO2: SULFUR_DIOXIDE,
  NO2: NITROGEN_DIOXIDE,
  H2S: HYDROGEN_SULFIDE,
  PH3: PHOSPHINE,
  HCl: HYDROCHLORIC_ACID,
  HNO3: NITRIC_ACID,
  CH3OH: METHANOL,
  CH4N2O: UREA,
  C7H8: TOLUENE,
  C9H8O4: ASPIRIN,
  C8H10N4O2: CAFFEINE,
  C3H8O3: GLYCEROL,
  C6H5OH: PHENOL,
  C2H4O: ACETALDEHYDE,
  C2H6O2: ETHYLENE_GLYCOL,
  C2H6O_ether: DIMETHYL_ETHER,
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
      mol.formula.toLowerCase().includes(lowerQuery) ||
      mol.metadata?.description?.toLowerCase().includes(lowerQuery) ||
      mol.metadata?.uses?.some(use => use.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get molecules by category
 */
export function getMoleculesByCategory(category: keyof typeof MOLECULE_CATEGORIES): Molecule3D[] {
  const formulas = MOLECULE_CATEGORIES[category]
  return formulas.map(formula => MOLECULES_3D[formula]).filter(Boolean)
}

/**
 * Get category for a molecule formula
 */
export function getMoleculeCategory(formula: string): string | undefined {
  for (const [category, formulas] of Object.entries(MOLECULE_CATEGORIES)) {
    if ((formulas as readonly string[]).includes(formula)) {
      return category
    }
  }
  return undefined
}
