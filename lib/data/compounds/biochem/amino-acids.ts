import { Compound, withMolarMass } from '../types'

const aminoAcidData: Array<Omit<Compound, 'molarMass'>> = [
  { id: 'alanine', name: 'Alanine', formula: 'C3H7NO2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition', 'biochemistry'] },
  { id: 'arginine', name: 'Arginine', formula: 'C6H14N4O2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition', 'supplements'] },
  { id: 'asparagine', name: 'Asparagine', formula: 'C4H8N2O3', category: 'amino-acid', physicalState: 'solid', uses: ['biochemistry'] },
  { id: 'aspartic-acid', name: 'Aspartic Acid', formula: 'C4H7NO4', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'cysteine', name: 'Cysteine', formula: 'C3H7NO2S', category: 'amino-acid', physicalState: 'solid', uses: ['protein building'] },
  { id: 'glutamic-acid', name: 'Glutamic Acid', formula: 'C5H9NO4', category: 'amino-acid', physicalState: 'solid', uses: ['flavor enhancer'] },
  { id: 'glutamine', name: 'Glutamine', formula: 'C5H10N2O3', category: 'amino-acid', physicalState: 'solid', uses: ['supplements'] },
  { id: 'glycine', name: 'Glycine', formula: 'C2H5NO2', category: 'amino-acid', physicalState: 'solid', uses: ['buffer', 'food additive'] },
  { id: 'histidine', name: 'Histidine', formula: 'C6H9N3O2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'isoleucine', name: 'Isoleucine', formula: 'C6H13NO2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'leucine', name: 'Leucine', formula: 'C6H13NO2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'lysine', name: 'Lysine', formula: 'C6H14N2O2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'methionine', name: 'Methionine', formula: 'C5H11NO2S', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'phenylalanine', name: 'Phenylalanine', formula: 'C9H11NO2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'proline', name: 'Proline', formula: 'C5H9NO2', category: 'amino-acid', physicalState: 'solid', uses: ['protein synthesis'] },
  { id: 'serine', name: 'Serine', formula: 'C3H7NO3', category: 'amino-acid', physicalState: 'solid', uses: ['biochemistry'] },
  { id: 'threonine', name: 'Threonine', formula: 'C4H9NO3', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'tryptophan', name: 'Tryptophan', formula: 'C11H12N2O2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'tyrosine', name: 'Tyrosine', formula: 'C9H11NO3', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
  { id: 'valine', name: 'Valine', formula: 'C5H11NO2', category: 'amino-acid', physicalState: 'solid', uses: ['nutrition'] },
]

export const AMINO_ACIDS: Compound[] = aminoAcidData.map(entry => withMolarMass(entry))
