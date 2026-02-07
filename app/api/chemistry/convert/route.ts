/**
 * VerChem Chemistry API - Unit Converter
 *
 * GET /api/chemistry/convert?value=100&from=C&to=F&category=temperature
 *
 * Categories:
 * - temperature (C, F, K)
 * - pressure (atm, Pa, kPa, bar, psi, mmHg)
 * - volume (L, mL, m3, gal, qt, floz)
 * - mass (g, kg, mg, lb, oz)
 * - length (m, cm, mm, nm, ft, in)
 * - energy (J, kJ, cal, kcal, eV, BTU)
 * - amount (mol, mmol, umol)
 * - concentration (M, mM, gL, mgL, ppm)
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  convert,
  formatValue,
  type ConversionCategory,
} from '@/lib/units/conversions';
import {
  TEMPERATURE_UNITS,
  PRESSURE_UNITS,
  VOLUME_UNITS,
  MASS_UNITS,
  LENGTH_UNITS,
  ENERGY_UNITS,
  AMOUNT_UNITS,
  CONCENTRATION_UNITS,
} from '@/lib/units/types';

// Available units per category
const AVAILABLE_UNITS: Record<ConversionCategory, string[]> = {
  temperature: Object.keys(TEMPERATURE_UNITS),
  pressure: Object.keys(PRESSURE_UNITS),
  volume: Object.keys(VOLUME_UNITS),
  mass: Object.keys(MASS_UNITS),
  length: Object.keys(LENGTH_UNITS),
  energy: Object.keys(ENERGY_UNITS),
  amount: Object.keys(AMOUNT_UNITS),
  concentration: Object.keys(CONCENTRATION_UNITS),
  density: ['kgm3', 'gcm3', 'gmL', 'kgL', 'lbft3', 'lbgal'],
  time: ['s', 'ms', 'us', 'ns', 'min', 'h', 'd'],
  flowRate: ['m3s', 'm3h', 'm3d', 'Ls', 'Lmin', 'gpm', 'MGD'],
};

const CATEGORIES = Object.keys(AVAILABLE_UNITS) as ConversionCategory[];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const value = searchParams.get('value');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const category = searchParams.get('category') as ConversionCategory | null;

  // Validate required parameters
  if (!value || !from || !to || !category) {
    return NextResponse.json(
      {
        error: 'Missing required parameters',
        required: ['value', 'from', 'to', 'category'],
        example: '/api/chemistry/convert?value=100&from=C&to=F&category=temperature',
        categories: CATEGORIES,
      },
      { status: 400 }
    );
  }

  // Validate category
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json(
      {
        error: 'Invalid category',
        category,
        availableCategories: CATEGORIES,
      },
      { status: 400 }
    );
  }

  // Validate units for category
  const availableUnits = AVAILABLE_UNITS[category];
  if (!availableUnits.includes(from)) {
    return NextResponse.json(
      {
        error: `Invalid "from" unit for ${category}`,
        from,
        availableUnits,
      },
      { status: 400 }
    );
  }
  if (!availableUnits.includes(to)) {
    return NextResponse.json(
      {
        error: `Invalid "to" unit for ${category}`,
        to,
        availableUnits,
      },
      { status: 400 }
    );
  }

  // Parse value
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return NextResponse.json(
      {
        error: 'Invalid value - must be a number',
        value,
      },
      { status: 400 }
    );
  }

  // Perform conversion
  try {
    const result = convert(numericValue, from, to, category);

    return NextResponse.json(
      {
        success: true,
        input: {
          value: numericValue,
          unit: from,
        },
        output: {
          value: result,
          unit: to,
          formatted: formatValue(result),
        },
        category,
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
        error: 'Conversion failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// List available categories and units
export async function OPTIONS() {
  return NextResponse.json({
    categories: CATEGORIES.map((cat) => ({
      name: cat,
      units: AVAILABLE_UNITS[cat],
    })),
  });
}
