/**
 * VerChem Chemistry API - pH Calculator
 *
 * GET /api/chemistry/ph?h=0.001 - Calculate from H+ concentration
 * GET /api/chemistry/ph?oh=0.00001 - Calculate from OH- concentration
 * GET /api/chemistry/ph?poh=5 - Calculate from pOH
 * GET /api/chemistry/ph?ph=7 - Get all related values
 * Optional: temperature_c=25&activity_model=concentration-as-activity
 * Other temperatures/activity models are outside this engine and are rejected.
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { publicApiRateLimit } from '@/lib/api/public-rate-limit';
import {
  PH_MODEL_25C,
  assertSupportedPHModelScope,
} from '@/lib/calculations/solutions';

/**
 * Strict numeric parse for query params. Unlike parseFloat (which accepts
 * trailing junk like "1abc"→1), Number() requires the whole string to be
 * numeric. Infinity and overflow ("1e309"→Infinity) are rejected by isFinite.
 */
function parseFiniteParam(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

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
  const pOH = PH_MODEL_25C.pKw - pH;
  const oh = PH_MODEL_25C.kw / h;

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < PH_MODEL_25C.neutralPH ? 'acidic' : pH > PH_MODEL_25C.neutralPH ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function calculateFromOH(oh: number): pHResult {
  const pOH = -Math.log10(oh);
  const pH = PH_MODEL_25C.pKw - pOH;
  const h = PH_MODEL_25C.kw / oh;

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < PH_MODEL_25C.neutralPH ? 'acidic' : pH > PH_MODEL_25C.neutralPH ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function calculateFrompH(pH: number): pHResult {
  const h = Math.pow(10, -pH);
  const pOH = PH_MODEL_25C.pKw - pH;
  const oh = Math.pow(10, -pOH);

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < PH_MODEL_25C.neutralPH ? 'acidic' : pH > PH_MODEL_25C.neutralPH ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function calculateFrompOH(pOH: number): pHResult {
  const pH = PH_MODEL_25C.pKw - pOH;
  const h = Math.pow(10, -pH);
  const oh = Math.pow(10, -pOH);

  return {
    pH,
    pOH,
    hConcentration: h,
    ohConcentration: oh,
    acidity: pH < PH_MODEL_25C.neutralPH ? 'acidic' : pH > PH_MODEL_25C.neutralPH ? 'basic' : 'neutral',
    description: getDescription(pH),
  };
}

function getDescription(pH: number): string {
  if (pH < 1) return 'Extremely acidic (battery acid level)';
  if (pH < 3) return 'Very strongly acidic (stomach acid, lemon juice)';
  if (pH < 5) return 'Strongly acidic (vinegar, soda)';
  if (pH < 6) return 'Moderately acidic (black coffee, rain water)';
  if (pH < 7) return 'Slightly acidic (milk, saliva)';
  if (pH === PH_MODEL_25C.neutralPH) return 'Neutral in this 25 °C ideal-dilute aqueous model';
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
  const limited = publicApiRateLimit(request, 'ph');
  if (limited) return limited;

  const searchParams = request.nextUrl.searchParams;
  const hParam = searchParams.get('h');
  const ohParam = searchParams.get('oh');
  const phParam = searchParams.get('ph');
  const pohParam = searchParams.get('poh');
  const temperatureParam = searchParams.get('temperature_c');
  const activityModelParam = searchParams.get('activity_model');

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
    const temperatureC = temperatureParam === null
      ? PH_MODEL_25C.temperatureC
      : parseFiniteParam(temperatureParam);
    if (temperatureC === null) {
      return NextResponse.json(
        { error: 'Invalid temperature_c - must be a finite number' },
        { status: 400 }
      );
    }
    const activityModel = activityModelParam ?? PH_MODEL_25C.activityModel;
    try {
      assertSupportedPHModelScope(temperatureC, activityModel);
    } catch (scopeError) {
      return NextResponse.json(
        {
          error: scopeError instanceof Error ? scopeError.message : 'Unsupported pH model scope',
          supportedModel: PH_MODEL_25C,
        },
        { status: 422 }
      );
    }

    if (hParam) {
      const h = parseFiniteParam(hParam);
      if (h === null || h <= 0) {
        return NextResponse.json(
          { error: 'Invalid H+ concentration - must be positive number' },
          { status: 400 }
        );
      }
      result = calculateFromH(h);
    } else if (ohParam) {
      const oh = parseFiniteParam(ohParam);
      if (oh === null || oh <= 0) {
        return NextResponse.json(
          { error: 'Invalid OH- concentration - must be positive number' },
          { status: 400 }
        );
      }
      result = calculateFromOH(oh);
    } else if (phParam) {
      const pH = parseFiniteParam(phParam);
      if (pH === null || pH < 0 || pH > 14) {
        return NextResponse.json(
          { error: 'Invalid pH - must be between 0 and 14' },
          { status: 400 }
        );
      }
      result = calculateFrompH(pH);
    } else if (pohParam) {
      const pOH = parseFiniteParam(pohParam);
      if (pOH === null || pOH < 0 || pOH > 14) {
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

    // Guard the computed result: even a finite input at an extreme magnitude can
    // push a derived value out of representable range (e.g. h=5e-324 → OH = Kw/h
    // = Infinity). Never serialize a non-finite number (it becomes null in JSON).
    if (
      !Number.isFinite(result.pH) ||
      !Number.isFinite(result.pOH) ||
      !Number.isFinite(result.hConcentration) ||
      !Number.isFinite(result.ohConcentration)
    ) {
      return NextResponse.json(
        { error: 'Input out of representable range - result is not finite' },
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
            value: PH_MODEL_25C.kw,
            description: 'Kw = 1.0×10^-14 for this aqueous 25 °C model only (Brown, LeMay & Bursten, Chemistry: The Central Science, 15th ed., Ch. 16)',
          },
        },
        model: PH_MODEL_25C,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-API-Version': '1.1.0',
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
