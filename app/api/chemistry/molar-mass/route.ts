/**
 * VerChem Chemistry API - Molar Mass Calculator
 *
 * GET /api/chemistry/molar-mass?formula=H2O
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PERIODIC_TABLE } from '@/lib/data/periodic-table';

// Parse chemical formula and calculate molar mass
function parseMolarMass(formula: string): {
  mass: number;
  composition: Array<{ element: string; count: number; mass: number; percentage: number }>;
  formula: string;
} | null {
  if (!formula || typeof formula !== 'string') {
    return null;
  }

  // Clean the formula
  const cleanFormula = formula.trim();
  if (!cleanFormula) {
    return null;
  }

  // Parse formula using regex
  // Matches: Element symbol (1-2 letters, first uppercase) followed by optional number
  const regex = /([A-Z][a-z]?)(\d*)/g;
  const matches = [...cleanFormula.matchAll(regex)];

  if (matches.length === 0) {
    return null;
  }

  const composition: Array<{ element: string; count: number; mass: number; percentage: number }> = [];
  let totalMass = 0;

  for (const match of matches) {
    const symbol = match[1];
    const count = match[2] ? parseInt(match[2], 10) : 1;

    if (!symbol) continue;

    // Find element in periodic table
    const element = PERIODIC_TABLE.find((e) => e.symbol === symbol);
    if (!element) {
      return null; // Unknown element
    }

    const elementMass = element.atomicMass * count;
    totalMass += elementMass;

    composition.push({
      element: symbol,
      count,
      mass: elementMass,
      percentage: 0, // Will calculate after total
    });
  }

  // Calculate percentages
  for (const comp of composition) {
    comp.percentage = (comp.mass / totalMass) * 100;
  }

  return {
    mass: totalMass,
    composition,
    formula: cleanFormula,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const formula = searchParams.get('formula');

  // Validate input
  if (!formula) {
    return NextResponse.json(
      {
        error: 'Missing formula parameter',
        example: '/api/chemistry/molar-mass?formula=H2O',
      },
      { status: 400 }
    );
  }

  // Validate formula length (prevent DoS)
  if (formula.length > 100) {
    return NextResponse.json(
      {
        error: 'Formula too long (max 100 characters)',
      },
      { status: 400 }
    );
  }

  // Calculate molar mass
  const result = parseMolarMass(formula);

  if (!result) {
    return NextResponse.json(
      {
        error: 'Invalid formula or unknown element',
        formula,
        hint: 'Use standard element symbols (e.g., H, He, Li, Na)',
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      formula: result.formula,
      molarMass: {
        value: result.mass,
        unit: 'g/mol',
        formatted: `${result.mass.toFixed(4)} g/mol`,
      },
      composition: result.composition.map((c) => ({
        element: c.element,
        count: c.count,
        mass: {
          value: c.mass,
          unit: 'g/mol',
        },
        percentage: {
          value: c.percentage,
          formatted: `${c.percentage.toFixed(2)}%`,
        },
      })),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'X-API-Version': '1.0.0',
      },
    }
  );
}
