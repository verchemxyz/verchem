// VerChem - Bond Type Restrictions
// Each element can only form certain types of bonds based on chemistry rules

export type BondType = 'single' | 'double' | 'triple'

/**
 * Get allowed bond types for an element
 *
 * Chemistry Rules:
 * - H, F, Cl, Br, I: Single bonds only (halogens can't expand octet)
 * - C, N: All types (can form single, double, triple bonds)
 * - O, S, P, Si: Single and double bonds
 *   - O: C=O (carbonyl), O=O (oxygen gas)
 *   - S: S=O (sulfur dioxide), S=S (disulfur)
 *   - P: P=O (phosphine oxide)
 *   - Si: Si=O (siloxanes), Si=Si (disilene)
 * - B: Mostly single (trigonal planar, electron deficient)
 *
 * Note: Period 3+ elements (S, P, Si, Cl) can expand their octet
 * to accommodate more bonds, but this is handled separately by
 * getMaxTotalBondOrder()
 */
export function getAllowedBondTypes(element: string): BondType[] {
  switch (element.toUpperCase()) {
    // Single bond only (halogens + hydrogen)
    case 'H':
    case 'F':
    case 'CL':
    case 'BR':
    case 'I':
      return ['single']

    // Single and double bonds (oxygen group + silicon)
    case 'O':
    case 'S':
    case 'P':
    case 'SI':  // Silicon can form Si=O, Si=Si double bonds
      return ['single', 'double']

    // All bond types (carbon, nitrogen)
    case 'C':
    case 'N':
      return ['single', 'double', 'triple']

    // Single only (boron, metals, default)
    case 'B':
    default:
      return ['single']
  }
}

/**
 * Check if a bond type is allowed between two atoms
 * Both atoms must support the bond type
 */
export function isBondTypeAllowed(
  element1: string,
  element2: string,
  bondType: BondType
): boolean {
  const allowed1 = getAllowedBondTypes(element1)
  const allowed2 = getAllowedBondTypes(element2)

  return allowed1.includes(bondType) && allowed2.includes(bondType)
}

/**
 * Get maximum bond order allowed between two atoms
 */
export function getMaxBondOrder(element1: string, element2: string): 1 | 2 | 3 {
  // Both atoms support triple? → max = 3
  if (
    getAllowedBondTypes(element1).includes('triple') &&
    getAllowedBondTypes(element2).includes('triple')
  ) {
    return 3
  }

  // Both atoms support double? → max = 2
  if (
    getAllowedBondTypes(element1).includes('double') &&
    getAllowedBondTypes(element2).includes('double')
  ) {
    return 2
  }

  // Otherwise → max = 1
  return 1
}

/**
 * Get maximum total bond order (sum of bond orders) allowed around a single atom
 * This approximates typical valence: e.g., H/F/Cl/Br/I → 1, O → 2, C/N/Si → 4.
 */
export function getMaxTotalBondOrder(element: string): number {
  switch (element.toUpperCase()) {
    // One bond only (duet/halogens)
    case 'H':
    case 'F':
    case 'CL':
    case 'BR':
    case 'I':
      return 1

    // Typically two bonds (oxygen group main-line examples)
    case 'O':
      return 2

    // Three bonds (boron often trigonal)
    case 'B':
      return 3

    // Up to four bonds (carbon, nitrogen, silicon, common P/S valence)
    case 'C':
    case 'N':
    case 'SI':
    case 'P':
    case 'S':
      return 4

    // Default fallback
    default:
      return 4
  }
}

/**
 * Validate if a bond order is allowed between two atoms
 */
export function validateBondOrder(
  element1: string,
  element2: string,
  order: 1 | 2 | 3
): { valid: boolean; reason?: string } {
  const bondType: BondType = order === 1 ? 'single' : order === 2 ? 'double' : 'triple'

  if (!isBondTypeAllowed(element1, element2, bondType)) {
    const allowed1 = getAllowedBondTypes(element1)
    const allowed2 = getAllowedBondTypes(element2)

    if (!allowed1.includes(bondType)) {
      return {
        valid: false,
        reason: `${element1} cannot form ${bondType} bonds (only ${allowed1.join(', ')})`
      }
    }

    if (!allowed2.includes(bondType)) {
      return {
        valid: false,
        reason: `${element2} cannot form ${bondType} bonds (only ${allowed2.join(', ')})`
      }
    }

    return { valid: false, reason: `${bondType} bond not allowed` }
  }

  return { valid: true }
}

/**
 * Get bond type name for display
 */
export function getBondTypeName(order: 1 | 2 | 3): string {
  switch (order) {
    case 1: return 'Single'
    case 2: return 'Double'
    case 3: return 'Triple'
  }
}

/**
 * Get bond type symbol
 */
export function getBondTypeSymbol(order: 1 | 2 | 3): string {
  switch (order) {
    case 1: return '—'
    case 2: return '='
    case 3: return '≡'
  }
}
