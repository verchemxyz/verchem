/**
 * VerChem Chemistry API - Elements Database
 *
 * GET /api/chemistry/elements - Get all elements
 * GET /api/chemistry/elements?symbol=Na - Get specific element
 * GET /api/chemistry/elements?number=11 - Get by atomic number
 * GET /api/chemistry/elements?category=alkali-metal - Filter by category
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PERIODIC_TABLE } from '@/lib/data/periodic-table';

// Simplified element response
interface ElementResponse {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: string;
  group: number | null;
  period: number;
  electronConfiguration: string;
  electronegativity: number | null;
  oxidationStates: number[];
  state: string;
  meltingPoint: number | null;
  boilingPoint: number | null;
  density: number | null;
}

function formatElement(element: typeof PERIODIC_TABLE[0]): ElementResponse {
  return {
    atomicNumber: element.atomicNumber,
    symbol: element.symbol,
    name: element.name,
    atomicMass: element.atomicMass,
    category: element.category,
    group: element.group ?? null,
    period: element.period,
    electronConfiguration: element.electronConfiguration,
    electronegativity: element.electronegativity ?? null,
    oxidationStates: element.oxidationStates,
    state: element.standardState,
    meltingPoint: element.meltingPoint ?? null,
    boilingPoint: element.boilingPoint ?? null,
    density: element.density ?? null,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const number = searchParams.get('number');
  const category = searchParams.get('category');
  const limit = searchParams.get('limit');

  // Get specific element by symbol
  if (symbol) {
    const element = PERIODIC_TABLE.find(
      (e) => e.symbol.toLowerCase() === symbol.toLowerCase()
    );

    if (!element) {
      return NextResponse.json(
        {
          error: 'Element not found',
          symbol,
          hint: 'Use standard element symbols (e.g., H, He, Li)',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        element: formatElement(element),
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'X-API-Version': '1.0.0',
        },
      }
    );
  }

  // Get specific element by atomic number
  if (number) {
    const atomicNumber = parseInt(number, 10);
    if (isNaN(atomicNumber) || atomicNumber < 1 || atomicNumber > 118) {
      return NextResponse.json(
        {
          error: 'Invalid atomic number',
          hint: 'Atomic number must be between 1 and 118',
        },
        { status: 400 }
      );
    }

    const element = PERIODIC_TABLE.find((e) => e.atomicNumber === atomicNumber);

    if (!element) {
      return NextResponse.json(
        {
          error: 'Element not found',
          atomicNumber,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        element: formatElement(element),
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'X-API-Version': '1.0.0',
        },
      }
    );
  }

  // Filter by category
  let filteredElements = PERIODIC_TABLE;
  if (category) {
    const categoryLower = category.toLowerCase();
    filteredElements = PERIODIC_TABLE.filter(
      (e) => e.category.toLowerCase() === categoryLower ||
             e.category.toLowerCase().replace(/-/g, ' ') === categoryLower.replace(/-/g, ' ')
    );

    if (filteredElements.length === 0) {
      return NextResponse.json(
        {
          error: 'No elements found in category',
          category,
          availableCategories: [...new Set(PERIODIC_TABLE.map((e) => e.category))].sort(),
        },
        { status: 404 }
      );
    }
  }

  // Apply limit
  const parsedLimit = limit ? parseInt(limit, 10) : 118;
  const maxLimit = Number.isNaN(parsedLimit) ? 118 : Math.min(parsedLimit, 118);

  return NextResponse.json(
    {
      success: true,
      count: Math.min(filteredElements.length, maxLimit),
      total: filteredElements.length,
      elements: filteredElements.slice(0, maxLimit).map(formatElement),
      categories: [...new Set(PERIODIC_TABLE.map((e) => e.category))].sort(),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'X-API-Version': '1.0.0',
      },
    }
  );
}
