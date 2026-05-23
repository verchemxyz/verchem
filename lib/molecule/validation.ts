/**
 * Molecule input validation — pure functions, no side effects.
 * Used by API routes for request validation.
 */

export const MAX_SMILES_LEN = 2000
export const MAX_NAME_LEN = 200
export const MAX_NOTES_LEN = 2000
export const MAX_MOL_BLOCK_LEN = 50000
export const MAX_TAG_LEN = 50
export const MAX_TAGS_COUNT = 20
export const MAX_INCHI_KEY_LEN = 50

export function validateCreateMoleculeInput(body: Record<string, unknown>): string[] {
  const errors: string[] = []

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Name is required')
  } else if (body.name.length > MAX_NAME_LEN) {
    errors.push(`Name must be at most ${MAX_NAME_LEN} characters`)
  }

  if (typeof body.smiles !== 'string' || body.smiles.trim().length === 0) {
    errors.push('SMILES is required')
  } else if (body.smiles.length > MAX_SMILES_LEN) {
    errors.push(`SMILES must be at most ${MAX_SMILES_LEN} characters`)
  }

  if (body.mol_block !== undefined) {
    if (typeof body.mol_block !== 'string') {
      errors.push('MOL block must be a string')
    } else if (body.mol_block.length > MAX_MOL_BLOCK_LEN) {
      errors.push(`MOL block must be at most ${MAX_MOL_BLOCK_LEN} characters`)
    }
  }

  if (body.inchi !== undefined) {
    if (typeof body.inchi !== 'string') {
      errors.push('InChI must be a string')
    } else if (body.inchi.length > MAX_SMILES_LEN) {
      errors.push(`InChI must be at most ${MAX_SMILES_LEN} characters`)
    }
  }

  if (body.inchi_key !== undefined) {
    if (typeof body.inchi_key !== 'string') {
      errors.push('InChIKey must be a string')
    } else if (body.inchi_key.length > MAX_INCHI_KEY_LEN) {
      errors.push(`InChIKey must be at most ${MAX_INCHI_KEY_LEN} characters`)
    }
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      errors.push('Notes must be a string')
    } else if (body.notes.length > MAX_NOTES_LEN) {
      errors.push(`Notes must be at most ${MAX_NOTES_LEN} characters`)
    }
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push('Tags must be an array')
    } else {
      if (body.tags.length > MAX_TAGS_COUNT) {
        errors.push(`At most ${MAX_TAGS_COUNT} tags allowed`)
      }
      for (const tag of body.tags) {
        if (typeof tag !== 'string' || tag.length > MAX_TAG_LEN) {
          errors.push(`Each tag must be a string of at most ${MAX_TAG_LEN} characters`)
          break
        }
      }
    }
  }

  if (body.is_public !== undefined && typeof body.is_public !== 'boolean') {
    errors.push('is_public must be a boolean')
  }

  return errors
}

export function validateUpdateMoleculeInput(body: Record<string, unknown>): string[] {
  const errors: string[] = []

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push('Name must be a non-empty string')
    } else if (body.name.length > MAX_NAME_LEN) {
      errors.push(`Name must be at most ${MAX_NAME_LEN} characters`)
    }
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      errors.push('Notes must be a string')
    } else if (body.notes.length > MAX_NOTES_LEN) {
      errors.push(`Notes must be at most ${MAX_NOTES_LEN} characters`)
    }
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push('Tags must be an array')
    } else {
      if (body.tags.length > MAX_TAGS_COUNT) {
        errors.push(`At most ${MAX_TAGS_COUNT} tags allowed`)
      }
      for (const tag of body.tags) {
        if (typeof tag !== 'string' || tag.length > MAX_TAG_LEN) {
          errors.push(`Each tag must be a string of at most ${MAX_TAG_LEN} characters`)
          break
        }
      }
    }
  }

  if (body.is_public !== undefined && typeof body.is_public !== 'boolean') {
    errors.push('is_public must be a boolean')
  }

  return errors
}
