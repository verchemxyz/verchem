import type { Compound } from '@/lib/data/compounds/types'

/** Exact public shape of one unversioned (v1) compound record. */
export interface LegacyCompoundResponse {
  id: string
  name: string
  formula: string
  molecularMass: number | null
  casNumber: string | null
  category: string
  physicalProperties: {
    state: string
    meltingPoint: number | null
    boilingPoint: number | null
    density: number | null
  }
  hazards: string[]
  uses: string[]
}

/**
 * Keep the v1 serializer pure so its deliberate chemistry/safety corrections
 * can be compared exhaustively with the 22dbdfa baseline.
 */
export function formatLegacyCompound(compound: Compound): LegacyCompoundResponse {
  const legacyMass = compound.molarMass ?? compound.molecularMass

  return {
    id: compound.id,
    name: compound.name,
    formula: compound.formula,
    // Never resurrect the historical `0 g/mol` sentinel for mixtures and
    // variable-composition materials.
    molecularMass: typeof legacyMass === 'number' &&
      Number.isFinite(legacyMass) && legacyMass > 0
      ? legacyMass
      : null,
    casNumber: compound.casNumber || compound.cas || null,
    category: compound.category,
    physicalProperties: {
      state: compound.physicalState || 'unknown',
      meltingPoint: compound.meltingPoint ?? null,
      boilingPoint: compound.boilingPoint ?? null,
      density: compound.density ?? null,
    },
    hazards: (compound.hazards || []).map((hazard) =>
      typeof hazard === 'string'
        ? hazard
        : hazard.type || hazard.ghsCode || ''
    ).filter(Boolean),
    uses: compound.uses || [],
  }
}
