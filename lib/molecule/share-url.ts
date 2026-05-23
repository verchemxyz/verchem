/**
 * URL encoding/decoding for shareable molecule links.
 *
 * Patterns:
 *  /draw?smiles=CCO         → preload ethanol from SMILES string
 *  /draw?mol_id=<uuid>      → fetch saved molecule from library
 *
 * Constraints:
 *  - SMILES query string: max 2000 chars (matches API max)
 *  - mol_id: UUID v4 format check
 */

export const MAX_SHARED_SMILES_LEN = 2000;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeShareUrl(opts: {
  smiles?: string;
  molId?: string;
  baseUrl?: string;
}): string {
  const base = opts.baseUrl ?? '/draw';
  const params = new URLSearchParams();
  if (opts.smiles) params.set('smiles', opts.smiles);
  if (opts.molId) params.set('mol_id', opts.molId);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function parseShareParams(searchParams: URLSearchParams): {
  smiles: string | null;
  molId: string | null;
  error: string | null;
} {
  const smiles = searchParams.get('smiles');
  const molId = searchParams.get('mol_id');

  if (smiles !== null) {
    if (smiles.length === 0) {
      return { smiles: null, molId: null, error: 'Empty SMILES parameter' };
    }
    if (smiles.length > MAX_SHARED_SMILES_LEN) {
      return {
        smiles: null,
        molId: null,
        error: 'SMILES too long (max 2000 chars)',
      };
    }
  }

  if (molId !== null) {
    if (!UUID_REGEX.test(molId)) {
      return { smiles: null, molId: null, error: 'Invalid mol_id format' };
    }
  }

  return { smiles, molId, error: null };
}
