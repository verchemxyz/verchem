/**
 * VerChem Public Chemistry API - Root Endpoint
 *
 * Available endpoints:
 * - GET /api/chemistry/v2 - endpoint index (this route)
 * - GET /api/chemistry/v2/molar-mass?formula=H2O
 * - GET /api/chemistry/v2/elements?symbol=Na
 * - GET /api/chemistry/v2/compounds?q=water
 * - GET /api/chemistry/v2/convert?value=100&from=C&to=F&category=temperature
 * - GET /api/chemistry/v2/ph?h=0.001
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { PUBLIC_API_LIMIT, publicApiV2RateLimit } from '@/lib/api/public-rate-limit';
import { PUBLIC_API_VERSION, publicApiJson } from '@/lib/api/public-contract';

export async function GET(request: Request) {
  const limited = publicApiV2RateLimit(request, 'index');
  if (limited) return limited;

  return publicApiJson({
    name: 'VerChem Chemistry API',
    version: PUBLIC_API_VERSION,
    description: 'Free chemistry calculations and data API',
    documentation: 'This endpoint is the migration contract and route index for the current public API.',
    contract: {
      majorVersion: 2,
      versioning: 'The v2 contract is isolated under /api/chemistry/v2/*. Unversioned /api/chemistry/* paths retain the v1 contract for existing callers.',
      migrationFrom: '1.x',
      breakingChanges: [
        'All endpoints can return HTTP 429 with Retry-After when the best-effort public limit is exceeded.',
        'Compound molecularMass can be null and is paired with molarMassBasis.',
        'Compound responses expose safetyDataStatus so empty hazards never imply safety.',
        'Molar-mass responses include expandedFormula when grouped formulae are normalized.',
        'The pH endpoint requires exactly one of h, oh, ph, or poh; v1 keeps its historical precedence when several are supplied.',
        'Every route-generated success and error JSON body includes apiVersion.',
        'Every response under /api/chemistry/v2, including framework 404, 405, and 500 responses, includes X-API-Version and X-API-Migration.',
      ],
    },
    endpoints: {
      '/api/chemistry/v2': {
        method: 'GET',
        description: 'API documentation (this endpoint)',
      },
      '/api/chemistry/v2/molar-mass': {
        method: 'GET',
        description: 'Calculate molar mass from formula',
        params: {
          formula: 'Chemical formula (e.g., H2O, NaCl, C6H12O6)',
        },
        example: '/api/chemistry/v2/molar-mass?formula=H2O',
        responseSchema: {
          formula: 'string (submitted formula)',
          expandedFormula: 'string (normalized formula used for composition)',
          molarMass: '{ value: number, unit: "g/mol", formatted: string }',
        },
      },
      '/api/chemistry/v2/elements': {
        method: 'GET',
        description: 'Get all elements or specific element data',
        params: {
          symbol: 'Optional element symbol (e.g., H, He, Li)',
        },
        example: '/api/chemistry/v2/elements?symbol=Na',
      },
      '/api/chemistry/v2/compounds': {
        method: 'GET',
        description: 'Search compounds database',
        params: {
          q: 'Search query (name or formula)',
          category: 'Filter by category',
        },
        example: '/api/chemistry/v2/compounds?q=water',
        responseSchema: {
          molecularMass: 'number | null',
          molarMassBasis: 'formula | repeat-unit | mixture-average | not-applicable',
          safetyDataStatus: 'curated-partial | not-curated',
          hazards: 'string[]',
          ghs: 'string[]',
        },
      },
      '/api/chemistry/v2/convert': {
        method: 'GET',
        description: 'Convert between units',
        params: {
          value: 'Number to convert',
          from: 'Source unit',
          to: 'Target unit',
          category: 'Unit category (temperature, pressure, volume, mass, length, energy)',
        },
        example: '/api/chemistry/v2/convert?value=100&from=C&to=F&category=temperature',
      },
      '/api/chemistry/v2/ph': {
        method: 'GET',
        description: 'Resolve pH, pOH, [H+], and [OH-] from exactly one supplied value',
        params: {
          h: 'H+ concentration (mol/L)',
          oh: 'OH- concentration (mol/L)',
          ph: 'pH value',
          poh: 'pOH value',
          temperature_c: 'Optional; this engine accepts only 25',
          activity_model: 'Optional; this engine accepts only concentration-as-activity',
        },
        example: '/api/chemistry/v2/ph?h=0.001',
      },
    },
    rateLimit: {
      limit: `${PUBLIC_API_LIMIT.maxRequests} requests per minute`,
      scope: 'per client, per server instance',
      note: 'Best-effort courtesy limit counted in instance memory, not a hard quota. Over budget returns HTTP 429 with Retry-After.',
    },
    support: {
      email: 'verchem.xyz@gmail.com',
      donate: 'https://verchem.xyz/support',
    },
    status: 'operational',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
