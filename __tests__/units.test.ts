/**
 * VerChem Unit System - Unit Tests
 * NIST-validated conversion accuracy
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import assert from 'node:assert/strict';

import {
  convertTemperature,
  convertPressure,
  convertVolume,
  convertMass,
  convertLength,
  convertEnergy,
  convertAmount,
  convertConcentration,
  convertDensity,
  convertTime,
  convertFlowRate,
  convert,
  formatValue,
  formatWithUnit,
  getConversionFactor,
  batchConvert,
} from '../lib/units/conversions';

type TestFn = () => void | Promise<void>;
type TestCase = { name: string; fn: TestFn };

const tests: TestCase[] = [];

function describe(_name: string, fn: () => void) {
  fn();
}

function test(name: string, fn: TestFn) {
  tests.push({ name, fn });
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected);
    },
    toBeCloseTo(expected: number, precision: number = 4) {
      const tolerance = Math.pow(10, -(precision - 1)) * 0.5;
      const diff = Math.abs((actual as number) - expected);
      assert.ok(diff < tolerance, `Expected ${actual} to be close to ${expected} (diff: ${diff}, tolerance: ${tolerance})`);
    },
    toEqual(expected: unknown) {
      assert.deepEqual(actual, expected);
    },
    toMatch(pattern: RegExp) {
      assert.match(actual as string, pattern);
    },
  };
}

// ============================================================================
// TEMPERATURE CONVERSIONS
// ============================================================================

describe('Temperature Conversions', () => {
  test('Celsius to Fahrenheit: 0°C = 32°F', () => {
    expect(convertTemperature(0, 'C', 'F')).toBeCloseTo(32, 5);
  });

  test('Celsius to Fahrenheit: 100°C = 212°F', () => {
    expect(convertTemperature(100, 'C', 'F')).toBeCloseTo(212, 5);
  });

  test('Celsius to Fahrenheit: -40°C = -40°F (intersection)', () => {
    expect(convertTemperature(-40, 'C', 'F')).toBeCloseTo(-40, 5);
  });

  test('Fahrenheit to Celsius: 32°F = 0°C', () => {
    expect(convertTemperature(32, 'F', 'C')).toBeCloseTo(0, 5);
  });

  test('Celsius to Kelvin: 0°C = 273.15K', () => {
    expect(convertTemperature(0, 'C', 'K')).toBeCloseTo(273.15, 5);
  });

  test('Kelvin to Celsius: 273.15K = 0°C', () => {
    expect(convertTemperature(273.15, 'K', 'C')).toBeCloseTo(0, 5);
  });

  test('Same unit returns same value', () => {
    expect(convertTemperature(25, 'C', 'C')).toBe(25);
  });
});

// ============================================================================
// PRESSURE CONVERSIONS
// ============================================================================

describe('Pressure Conversions', () => {
  test('1 atm = 101325 Pa (NIST)', () => {
    expect(convertPressure(1, 'atm', 'Pa')).toBeCloseTo(101325, 0);
  });

  test('1 atm = 101.325 kPa', () => {
    expect(convertPressure(1, 'atm', 'kPa')).toBeCloseTo(101.325, 3);
  });

  test('1 atm ≈ 14.696 psi', () => {
    expect(convertPressure(1, 'atm', 'psi')).toBeCloseTo(14.696, 2);
  });

  test('1 atm ≈ 760 mmHg', () => {
    expect(convertPressure(1, 'atm', 'mmHg')).toBeCloseTo(760, 0);
  });

  test('1 bar ≈ 0.9869 atm', () => {
    expect(convertPressure(1, 'bar', 'atm')).toBeCloseTo(0.9869, 3);
  });
});

// ============================================================================
// VOLUME CONVERSIONS
// ============================================================================

describe('Volume Conversions', () => {
  test('1 L = 1000 mL', () => {
    expect(convertVolume(1, 'L', 'mL')).toBeCloseTo(1000, 5);
  });

  test('1000 L = 1 m³', () => {
    expect(convertVolume(1000, 'L', 'm3')).toBeCloseTo(1, 5);
  });

  test('1 gal (US) ≈ 3.78541 L', () => {
    expect(convertVolume(1, 'gal', 'L')).toBeCloseTo(3.78541, 4);
  });

  test('1 mL = 1 cm³', () => {
    expect(convertVolume(1, 'mL', 'cm3')).toBeCloseTo(1, 5);
  });
});

// ============================================================================
// MASS CONVERSIONS
// ============================================================================

describe('Mass Conversions', () => {
  test('1 kg = 1000 g', () => {
    expect(convertMass(1, 'kg', 'g')).toBeCloseTo(1000, 5);
  });

  test('1 lb = 453.59237 g (NIST exact)', () => {
    expect(convertMass(1, 'lb', 'g')).toBeCloseTo(453.59237, 4);
  });

  test('1 kg ≈ 2.2046 lb', () => {
    expect(convertMass(1, 'kg', 'lb')).toBeCloseTo(2.2046, 3);
  });

  test('1 oz ≈ 28.3495 g', () => {
    expect(convertMass(1, 'oz', 'g')).toBeCloseTo(28.3495, 3);
  });
});

// ============================================================================
// LENGTH CONVERSIONS
// ============================================================================

describe('Length Conversions', () => {
  test('1 m = 100 cm', () => {
    expect(convertLength(1, 'm', 'cm')).toBeCloseTo(100, 5);
  });

  test('1 ft = 0.3048 m (NIST exact)', () => {
    expect(convertLength(1, 'ft', 'm')).toBeCloseTo(0.3048, 4);
  });

  test('1 in = 2.54 cm (NIST exact)', () => {
    expect(convertLength(1, 'in', 'cm')).toBeCloseTo(2.54, 5);
  });

  test('1 mi ≈ 1.609344 km', () => {
    expect(convertLength(1, 'mi', 'km')).toBeCloseTo(1.609344, 5);
  });

  test('1 nm = 10 Å', () => {
    expect(convertLength(1, 'nm', 'A')).toBeCloseTo(10, 5);
  });
});

// ============================================================================
// ENERGY CONVERSIONS
// ============================================================================

describe('Energy Conversions', () => {
  test('1 kJ = 1000 J', () => {
    expect(convertEnergy(1, 'kJ', 'J')).toBeCloseTo(1000, 5);
  });

  test('1 cal = 4.184 J', () => {
    expect(convertEnergy(1, 'cal', 'J')).toBeCloseTo(4.184, 3);
  });

  test('1 BTU ≈ 1055.06 J', () => {
    expect(convertEnergy(1, 'BTU', 'J')).toBeCloseTo(1055.06, 0);
  });

  test('1 kWh = 3,600,000 J', () => {
    expect(convertEnergy(1, 'kWh', 'J')).toBeCloseTo(3600000, 0);
  });
});

// ============================================================================
// AMOUNT (MOLES) CONVERSIONS
// ============================================================================

describe('Amount Conversions', () => {
  test('1 mol = 1000 mmol', () => {
    expect(convertAmount(1, 'mol', 'mmol')).toBeCloseTo(1000, 5);
  });

  test('1 kmol = 1000 mol', () => {
    expect(convertAmount(1, 'kmol', 'mol')).toBeCloseTo(1000, 5);
  });
});

// ============================================================================
// TIME CONVERSIONS
// ============================================================================

describe('Time Conversions', () => {
  test('1 min = 60 s', () => {
    expect(convertTime(1, 'min', 's')).toBeCloseTo(60, 5);
  });

  test('1 h = 3600 s', () => {
    expect(convertTime(1, 'h', 's')).toBeCloseTo(3600, 5);
  });

  test('1 d = 24 h', () => {
    expect(convertTime(1, 'd', 'h')).toBeCloseTo(24, 5);
  });
});

// ============================================================================
// FLOW RATE CONVERSIONS
// ============================================================================

describe('Flow Rate Conversions', () => {
  test('1 m³/h ≈ 0.2778 L/s', () => {
    expect(convertFlowRate(1, 'm3h', 'Ls')).toBeCloseTo(0.2778, 3);
  });

  test('1 gpm ≈ 0.0631 L/s', () => {
    expect(convertFlowRate(1, 'gpm', 'Ls')).toBeCloseTo(0.0631, 3);
  });

  test('1 MGD ≈ 3785.41 m³/d', () => {
    expect(convertFlowRate(1, 'MGD', 'm3d')).toBeCloseTo(3785.41, 0);
  });
});

// ============================================================================
// GENERIC CONVERT FUNCTION
// ============================================================================

describe('Generic Convert Function', () => {
  test('convert temperature', () => {
    expect(convert(100, 'C', 'F', 'temperature')).toBeCloseTo(212, 5);
  });

  test('convert pressure', () => {
    expect(convert(1, 'atm', 'psi', 'pressure')).toBeCloseTo(14.696, 2);
  });

  test('convert mass', () => {
    expect(convert(1, 'lb', 'kg', 'mass')).toBeCloseTo(0.4536, 3);
  });
});

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

describe('Formatting Utilities', () => {
  test('formatValue removes trailing zeros', () => {
    expect(formatValue(1.5000)).toBe('1.5');
  });

  test('formatValue removes decimal point when no decimals', () => {
    expect(formatValue(100.0000)).toBe('100');
  });

  test('formatWithUnit combines value and unit', () => {
    expect(formatWithUnit(25, '°C')).toBe('25 °C');
  });
});

// ============================================================================
// CONVERSION FACTOR LOOKUP
// ============================================================================

describe('Conversion Factor Lookup', () => {
  test('getConversionFactor kg to g', () => {
    expect(getConversionFactor('kg', 'g', 'mass')).toBeCloseTo(1000, 5);
  });

  test('same unit returns 1', () => {
    expect(getConversionFactor('g', 'g', 'mass')).toBe(1);
  });
});

// ============================================================================
// BATCH CONVERSION
// ============================================================================

describe('Batch Conversion', () => {
  test('batchConvert mass values', () => {
    const values = [1, 2, 3];
    const converted = batchConvert(values, 'kg', 'g', 'mass');
    expect(converted[0]).toBeCloseTo(1000, 5);
    expect(converted[1]).toBeCloseTo(2000, 5);
    expect(converted[2]).toBeCloseTo(3000, 5);
  });

  test('batchConvert temperature', () => {
    const values = [0, 100];
    const converted = batchConvert(values, 'C', 'F', 'temperature');
    expect(converted[0]).toBeCloseTo(32, 5);
    expect(converted[1]).toBeCloseTo(212, 5);
  });
});

// ============================================================================
// REAL-WORLD CHEMISTRY CALCULATIONS
// ============================================================================

describe('Real-World Chemistry Calculations', () => {
  test('Standard conditions: 0°C = 273.15 K', () => {
    expect(convertTemperature(0, 'C', 'K')).toBeCloseTo(273.15, 5);
  });

  test('Standard conditions: 1 atm = 101.325 kPa', () => {
    expect(convertPressure(1, 'atm', 'kPa')).toBeCloseTo(101.325, 3);
  });

  test('Body temperature: 98.6°F ≈ 37°C', () => {
    expect(convertTemperature(98.6, 'F', 'C')).toBeCloseTo(37, 1);
  });

  test('Molar volume at STP: 22.414 L = 0.022414 m³', () => {
    expect(convertVolume(22.414, 'L', 'm3')).toBeCloseTo(0.022414, 6);
  });

  test('Water density: 1 g/cm³ = 1000 kg/m³', () => {
    expect(convertDensity(1, 'gcm3', 'kgm3')).toBeCloseTo(1000, 5);
  });

  test('Reaction enthalpy: -285.8 kJ ≈ -68.32 kcal', () => {
    expect(convertEnergy(-285.8, 'kJ', 'kcal')).toBeCloseTo(-68.32, 1);
  });

  test('Wastewater flow: 10 MGD ≈ 37854.1 m³/d', () => {
    expect(convertFlowRate(10, 'MGD', 'm3d')).toBeCloseTo(37854.1, 0);
  });
});

// ============================================================================
// RUN TESTS
// ============================================================================

async function runTests() {
  console.log('📐 VerChem Unit Conversion Tests');
  console.log('='.repeat(50));
  console.log('');

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${(error as Error).message}`);
      failed++;
    }
  }

  console.log('');
  console.log('📊 Test Summary');
  console.log('-'.repeat(20));
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('✅ All unit conversion tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    process.exit(1);
  }
}

runTests();
