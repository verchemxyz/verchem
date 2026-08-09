/**
 * VerChem Public Chemistry API - Root Endpoint
 *
 * Available endpoints:
 * - GET /api/chemistry - API info and documentation
 * - GET /api/chemistry/molar-mass?formula=H2O
 * - GET /api/chemistry/elements/:symbol
 * - GET /api/chemistry/convert?value=100&from=C&to=F&category=temperature
 * - POST /api/chemistry/balance (equation balancing)
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'VerChem Chemistry API',
    version: '1.0.0',
    description: 'Free chemistry calculations and data API',
    documentation: 'https://verchem.xyz/api/docs',
    endpoints: {
      '/api/chemistry': {
        method: 'GET',
        description: 'API documentation (this endpoint)',
      },
      '/api/chemistry/molar-mass': {
        method: 'GET',
        description: 'Calculate molar mass from formula',
        params: {
          formula: 'Chemical formula (e.g., H2O, NaCl, C6H12O6)',
        },
        example: '/api/chemistry/molar-mass?formula=H2O',
      },
      '/api/chemistry/elements': {
        method: 'GET',
        description: 'Get all elements or specific element data',
        params: {
          symbol: 'Optional element symbol (e.g., H, He, Li)',
        },
        example: '/api/chemistry/elements?symbol=Na',
      },
      '/api/chemistry/compounds': {
        method: 'GET',
        description: 'Search compounds database',
        params: {
          q: 'Search query (name or formula)',
          category: 'Filter by category',
        },
        example: '/api/chemistry/compounds?q=water',
      },
      '/api/chemistry/convert': {
        method: 'GET',
        description: 'Convert between units',
        params: {
          value: 'Number to convert',
          from: 'Source unit',
          to: 'Target unit',
          category: 'Unit category (temperature, pressure, volume, mass, length, energy)',
        },
        example: '/api/chemistry/convert?value=100&from=C&to=F&category=temperature',
      },
      '/api/chemistry/ph': {
        method: 'GET',
        description: 'Calculate pH from concentration or pOH',
        params: {
          h: 'H+ concentration (mol/L)',
          oh: 'OH- concentration (mol/L)',
          poh: 'pOH value',
        },
        example: '/api/chemistry/ph?h=0.001',
      },
    },
    rateLimit: {
      free: '100 requests/hour',
      authenticated: '1000 requests/hour',
      note: 'Login with AIVerID to increase limits',
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
      'X-API-Version': '1.0.0',
    },
  });
}
