/**
 * VerChem Chemistry API - Compounds Database
 *
 * GET /api/chemistry/compounds - List all compounds
 * GET /api/chemistry/compounds?q=water - Search by name/formula
 * GET /api/chemistry/compounds?category=acid - Filter by category
 * GET /api/chemistry/compounds?id=h2o - Get specific compound
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { COMMON_COMPOUNDS } from '@/lib/data/compounds';

// Simplified compound response
interface CompoundResponse {
  id: string;
  name: string;
  formula: string;
  molecularMass: number | null;
  casNumber: string | null;
  category: string;
  physicalProperties: {
    state: string;
    meltingPoint: number | null;
    boilingPoint: number | null;
    density: number | null;
  };
  hazards: string[];
  uses: string[];
}

function formatCompound(compound: typeof COMMON_COMPOUNDS[0]): CompoundResponse {
  return {
    id: compound.id,
    name: compound.name,
    formula: compound.formula,
    molecularMass: compound.molarMass ?? compound.molecularMass ?? null,
    casNumber: compound.casNumber || compound.cas || null,
    category: compound.category,
    physicalProperties: {
      state: compound.physicalState || 'unknown',
      meltingPoint: compound.meltingPoint ?? null,
      boilingPoint: compound.boilingPoint ?? null,
      density: compound.density ?? null,
    },
    hazards: (compound.hazards || []).map((h) =>
      typeof h === 'string' ? h : (h as { type?: string; ghsCode?: string }).type || (h as { type?: string; ghsCode?: string }).ghsCode || ''
    ).filter(Boolean),
    uses: compound.uses || [],
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const id = searchParams.get('id');
  const limit = searchParams.get('limit');

  // Get specific compound by ID
  if (id) {
    const compound = COMMON_COMPOUNDS.find(
      (c) => c.id.toLowerCase() === id.toLowerCase()
    );

    if (!compound) {
      return NextResponse.json(
        {
          error: 'Compound not found',
          id,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        compound: formatCompound(compound),
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

  // Filter compounds
  let filteredCompounds = COMMON_COMPOUNDS;

  // Search by query
  if (query) {
    const queryLower = query.toLowerCase();
    filteredCompounds = COMMON_COMPOUNDS.filter(
      (c) =>
        c.name.toLowerCase().includes(queryLower) ||
        c.formula.toLowerCase().includes(queryLower) ||
        (c.nameThai && c.nameThai.includes(queryLower)) ||
        (c.iupacName && c.iupacName.toLowerCase().includes(queryLower))
    );
  }

  // Filter by category
  if (category) {
    const categoryLower = category.toLowerCase();
    filteredCompounds = filteredCompounds.filter(
      (c) => c.category.toLowerCase() === categoryLower
    );
  }

  // Apply limit
  const parsedLimit = limit ? parseInt(limit, 10) : 50;
  const maxLimit = Number.isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 100);

  // Get all categories
  const categories = [...new Set(COMMON_COMPOUNDS.map((c) => c.category))].sort();

  return NextResponse.json(
    {
      success: true,
      count: Math.min(filteredCompounds.length, maxLimit),
      total: filteredCompounds.length,
      compounds: filteredCompounds.slice(0, maxLimit).map(formatCompound),
      categories,
      filters: {
        query: query || null,
        category: category || null,
        limit: maxLimit,
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
}
