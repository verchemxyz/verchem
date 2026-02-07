/**
 * VerChem Chemistry API - pH Calculator
 *
 * GET /api/chemistry/ph?h=0.001 - Calculate from H+ concentration
 * GET /api/chemistry/ph?oh=0.00001 - Calculate from OH- concentration
 * GET /api/chemistry/ph?poh=5 - Calculate from pOH
 * GET /api/chemistry/ph?ph=7 - Get all related values
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextRequest, NextResponse } from 'next/server';

// Water ion product at 25°C
const Kw = 1e-14;

interface pHResult {
  pH: number;
  pOH: number;
  hConcentration: number;
  ohConcentration: number;
  acidity: 'acidic' | 'neutral' | 'basic';
  description: string;
}

function calculateFromH(h: number): pHResult {
  const pH = -Math.log10(h);
  const pOH = 14 - pH;
  const oh = Kw / h;

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < 7 ? 'acidic' : pH > 7 ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function calculateFromOH(oh: number): pHResult {
  const pOH = -Math.log10(oh);
  const pH = 14 - pOH;
  const h = Kw / oh;

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < 7 ? 'acidic' : pH > 7 ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function calculateFrompH(pH: number): pHResult {
  const h = Math.pow(10, -pH);
  const pOH = 14 - pH;
  const oh = Math.pow(10, -pOH);

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < 7 ? 'acidic' : pH > 7 ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function calculateFrompOH(pOH: number): pHResult {
  const pH = 14 - pOH;
  const h = Math.pow(10, -pH);
  const oh = Math.pow(10, -pOH);

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < 7 ? 'acidic' : pH > 7 ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function getDescription(pH: number): string {
  if (pH < 1) return 'Extremely acidic (battery acid level)';
  if (pH < 3) return 'Very strongly acidic (stomach acid, lemon juice)';
  if (pH < 5) return 'Strongly acidic (vinegar, soda)';
  if (pH < 6) return 'Moderately acidic (black coffee, rain water)';
  if (pH < 7) return 'Slightly acidic (milk, saliva)';
  if (pH === 7) return 'Neutral (pure water)';
  if (pH < 8) return 'Slightly basic (blood, sea water)';
  if (pH < 9) return 'Moderately basic (baking soda)';
  if (pH < 11) return 'Strongly basic (ammonia, soap)';
  if (pH < 13) return 'Very strongly basic (bleach)';
  return 'Extremely basic (drain cleaner, oven cleaner)';
}

function formatScientific(value: number): string {
  if (value === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10^${exp}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hParam = searchParams.get('h');
  const ohParam = searchParams.get('oh');
  const phParam = searchParams.get('ph');
  const pohParam = searchParams.get('poh');

  // Check if any parameter is provided
  if (!hParam && !ohParam && !phParam && !pohParam) {
    return NextResponse.json(
      {
        error: 'Missing parameter',
        hint: 'Provide one of: h, oh, ph, poh',
        examples: [
          '/api/chemistry/ph?h=0.001',
          '/api/chemistry/ph?oh=0.00001',
          '/api/chemistry/ph?ph=7',
          '/api/chemistry/ph?poh=5',
        ],
      },
      { status: 400 }
    );
  }

  let result: pHResult;

  try {
    if (hParam) {
      const h = parseFloat(hParam);
      if (isNaN(h) || h <= 0) {
        return NextResponse.json(
          { error: 'Invalid H+ concentration - must be positive number' },
          { status: 400 }
        );
      }
      result = calculateFromH(h);
    } else if (ohParam) {
      const oh = parseFloat(ohParam);
      if (isNaN(oh) || oh <= 0) {
        return NextResponse.json(
          { error: 'Invalid OH- concentration - must be positive number' },
          { status: 400 }
        );
      }
      result = calculateFromOH(oh);
    } else if (phParam) {
      const pH = parseFloat(phParam);
      if (isNaN(pH) || pH < 0 || pH > 14) {
        return NextResponse.json(
          { error: 'Invalid pH - must be between 0 and 14' },
          { status: 400 }
        );
      }
      result = calculateFrompH(pH);
    } else if (pohParam) {
      const pOH = parseFloat(pohParam);
      if (isNaN(pOH) || pOH < 0 || pOH > 14) {
        return NextResponse.json(
          { error: 'Invalid pOH - must be between 0 and 14' },
          { status: 400 }
        );
      }
      result = calculateFrompOH(pOH);
    } else {
      return NextResponse.json(
        { error: 'No valid parameter provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        result: {
          pH: {
            value: result.pH,
            formatted: result.pH.toFixed(2),
          },
          pOH: {
            value: result.pOH,
            formatted: result.pOH.toFixed(2),
          },
          hConcentration: {
            value: result.hConcentration,
            unit: 'mol/L',
            scientific: formatScientific(result.hConcentration),
          },
          ohConcentration: {
            value: result.ohConcentration,
            unit: 'mol/L',
            scientific: formatScientific(result.ohConcentration),
          },
          acidity: result.acidity,
          description: result.description,
        },
        constants: {
          Kw: {
            value: Kw,
            description: 'Water ion product at 25°C',
          },
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-API-Version': '1.0.0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Calculation failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
