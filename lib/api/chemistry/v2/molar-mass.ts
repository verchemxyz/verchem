/**
 * VerChem Chemistry API - Molar Mass Calculator
 *
 * GET /api/chemistry/v2/molar-mass?formula=H2O
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextRequest } from 'next/server';
import { publicApiV2RateLimit } from '@/lib/api/public-rate-limit';
import { publicApiJson } from '@/lib/api/public-contract';
import { PERIODIC_TABLE } from '@/lib/data/periodic-table';
import {
  MAX_SUBSCRIPT,
  expandParentheses,
  parseFormula,
} from '@/lib/calculations/equation-balancer';

const ELEMENT_BY_SYMBOL = new Map(PERIODIC_TABLE.map((element) => [element.symbol, element]));

// Parse chemical formula and calculate molar mass
function parseMolarMass(formula: string): {
  mass: number;
  composition: Array<{ element: string; count: number; mass: number; percentage: number }>;
  formula: string;
} | null {
  if (!formula || typeof formula !== 'string') {
    return null;
  }

  // Clean the formula. Cap the length before any expansion: nested groups can
  // multiply out, so bound the input rather than the intermediate.
  const trimmed = formula.trim();
  if (!trimmed || trimmed.length > 200) {
    return null;
  }

  let elementCounts: Record<string, number>;
  try {
    // This is the equation engine's strict, full-consumption parser. It rejects
    // unknown symbols, unbalanced groups, zero/leading-zero subscripts, unsafe
    // integers, and counts above MAX_SUBSCRIPT before any mass arithmetic.
    elementCounts = parseFormula(trimmed);
  } catch {
    return null;
  }

  const cleanFormula = expandParentheses(trimmed);

  const composition: Array<{ element: string; count: number; mass: number; percentage: number }> = [];
  let totalMass = 0;

  // parseFormula aggregates repeated symbols, so CH3COOH produces one row per
  // element (C2, H4, O2) rather than duplicate C/H/O rows.
  for (const [symbol, count] of Object.entries(elementCounts)) {
    if (!Number.isSafeInteger(count) || count < 1 || count > MAX_SUBSCRIPT) {
      return null;
    }

    const element = ELEMENT_BY_SYMBOL.get(symbol);
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

  // Guard against a zero / non-finite total mass before computing percentages
  // (would otherwise produce NaN% and a meaningless molarMass: 0).
  if (!(totalMass > 0) || !Number.isFinite(totalMass)) {
    return null;
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
  const limited = publicApiV2RateLimit(request, 'molar-mass');
  if (limited) return limited;

  const searchParams = request.nextUrl.searchParams;
  const formula = searchParams.get('formula');

  // Validate input
  if (!formula) {
    return publicApiJson(
      {
        error: 'Missing formula parameter',
        example: '/api/chemistry/v2/molar-mass?formula=H2O',
      },
      { status: 400 }
    );
  }

  // Validate formula length (prevent DoS)
  if (formula.length > 100) {
    return publicApiJson(
      {
        error: 'Formula too long (max 100 characters)',
      },
      { status: 400 }
    );
  }

  // Calculate molar mass
  const result = parseMolarMass(formula);

  if (!result) {
    return publicApiJson(
      {
        error: 'Invalid formula, unknown element, or subscript out of range',
        formula,
        hint: `Use standard element symbols and balanced groups. Every subscript and aggregate element count must be an integer from 1 to ${MAX_SUBSCRIPT.toLocaleString('en-US')}.`,
      },
      { status: 400 }
    );
  }

  return publicApiJson(
    {
      success: true,
      formula: formula.trim(),
      // Groups expanded, so Ca(OH)2 reports the CaO2H2 the composition is keyed on.
      expandedFormula: result.formula,
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
      },
    }
  );
}
