/**
 * VerChem Unit System - Conversion Functions
 * NIST-validated conversion factors
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 *
 * References:
 * - NIST SP 811 (Guide for the Use of the International System of Units)
 * - NIST Reference on Constants, Units, and Uncertainty
 */

import type {
  TemperatureUnit,
  PressureUnit,
  VolumeUnit,
  MassUnit,
  LengthUnit,
  EnergyUnit,
  AmountUnit,
  ConcentrationUnit,
  DensityUnit,
  TimeUnit,
  FlowRateUnit,
} from './types';

// ============================================================================
// TEMPERATURE CONVERSIONS
// Temperature requires special handling (not simple multiplication)
// ============================================================================

export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit
): number {
  if (from === to) return value;

  // First convert to Kelvin (base unit)
  let kelvin: number;
  switch (from) {
    case 'C':
      kelvin = value + 273.15;
      break;
    case 'F':
      kelvin = (value - 32) * (5 / 9) + 273.15;
      break;
    case 'K':
      kelvin = value;
      break;
  }

  // Then convert from Kelvin to target
  switch (to) {
    case 'C':
      return kelvin - 273.15;
    case 'F':
      return (kelvin - 273.15) * (9 / 5) + 32;
    case 'K':
      return kelvin;
  }
}

// ============================================================================
// PRESSURE CONVERSIONS
// Base unit: Pascal (Pa)
// ============================================================================

const PRESSURE_TO_PA: Record<PressureUnit, number> = {
  Pa: 1,
  kPa: 1000,
  bar: 100000,
  atm: 101325, // NIST exact value
  psi: 6894.757293168361, // NIST value
  mmHg: 133.322387415, // NIST value
  torr: 133.322368421, // 1/760 atm exactly
  inHg: 3386.389, // at 0°C
};

export function convertPressure(
  value: number,
  from: PressureUnit,
  to: PressureUnit
): number {
  if (from === to) return value;
  const pascals = value * PRESSURE_TO_PA[from];
  return pascals / PRESSURE_TO_PA[to];
}

// ============================================================================
// VOLUME CONVERSIONS
// Base unit: Liter (L)
// ============================================================================

const VOLUME_TO_L: Record<VolumeUnit, number> = {
  L: 1,
  mL: 0.001,
  uL: 0.000001,
  m3: 1000,
  cm3: 0.001, // 1 cm³ = 1 mL
  gal: 3.785411784, // US gallon, NIST exact
  qt: 0.946352946, // US quart
  pt: 0.473176473, // US pint
  floz: 0.0295735295625, // US fluid ounce
  cup: 0.2365882365, // US cup
};

export function convertVolume(
  value: number,
  from: VolumeUnit,
  to: VolumeUnit
): number {
  if (from === to) return value;
  const liters = value * VOLUME_TO_L[from];
  return liters / VOLUME_TO_L[to];
}

// ============================================================================
// MASS CONVERSIONS
// Base unit: Gram (g)
// ============================================================================

const MASS_TO_G: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  ug: 0.000001,
  lb: 453.59237, // NIST exact value
  oz: 28.349523125, // NIST value
  ton: 907184.74, // US short ton
  tonne: 1000000, // Metric ton
};

export function convertMass(
  value: number,
  from: MassUnit,
  to: MassUnit
): number {
  if (from === to) return value;
  const grams = value * MASS_TO_G[from];
  return grams / MASS_TO_G[to];
}

// ============================================================================
// LENGTH CONVERSIONS
// Base unit: Meter (m)
// ============================================================================

const LENGTH_TO_M: Record<LengthUnit, number> = {
  m: 1,
  cm: 0.01,
  mm: 0.001,
  um: 0.000001,
  nm: 0.000000001,
  pm: 0.000000000001,
  A: 0.0000000001, // Angstrom
  km: 1000,
  in: 0.0254, // NIST exact value
  ft: 0.3048, // NIST exact value
  yd: 0.9144, // NIST exact value
  mi: 1609.344, // NIST exact value
};

export function convertLength(
  value: number,
  from: LengthUnit,
  to: LengthUnit
): number {
  if (from === to) return value;
  const meters = value * LENGTH_TO_M[from];
  return meters / LENGTH_TO_M[to];
}

// ============================================================================
// ENERGY CONVERSIONS
// Base unit: Joule (J)
// ============================================================================

const ENERGY_TO_J: Record<EnergyUnit, number> = {
  J: 1,
  kJ: 1000,
  cal: 4.184, // Thermochemical calorie, NIST
  kcal: 4184, // Kilocalorie
  eV: 1.602176634e-19, // NIST 2019 exact value
  BTU: 1055.05585262, // IT BTU, NIST
  Wh: 3600,
  kWh: 3600000,
};

export function convertEnergy(
  value: number,
  from: EnergyUnit,
  to: EnergyUnit
): number {
  if (from === to) return value;
  const joules = value * ENERGY_TO_J[from];
  return joules / ENERGY_TO_J[to];
}

// ============================================================================
// AMOUNT (MOLES) CONVERSIONS
// Base unit: Mole (mol)
// ============================================================================

const AMOUNT_TO_MOL: Record<AmountUnit, number> = {
  mol: 1,
  mmol: 0.001,
  umol: 0.000001,
  nmol: 0.000000001,
  kmol: 1000,
};

export function convertAmount(
  value: number,
  from: AmountUnit,
  to: AmountUnit
): number {
  if (from === to) return value;
  const moles = value * AMOUNT_TO_MOL[from];
  return moles / AMOUNT_TO_MOL[to];
}

// ============================================================================
// CONCENTRATION CONVERSIONS
// Base unit: Molar (M = mol/L)
// Note: Some conversions require molecular weight (handled separately)
// ============================================================================

const CONCENTRATION_TO_M: Record<ConcentrationUnit, number> = {
  M: 1,
  mM: 0.001,
  uM: 0.000001,
  nM: 0.000000001,
  N: 1, // Normality (depends on equivalents, simplified here)
  molL: 1,
  gL: 1, // Requires MW for true conversion
  mgL: 0.001, // Requires MW for true conversion
  ugL: 0.000001, // Requires MW for true conversion
  ppm: 0.001, // Approximation for aqueous solutions
  ppb: 0.000001, // Approximation for aqueous solutions
  percent: 10, // Approximation (10 g/L per %)
};

export function convertConcentration(
  value: number,
  from: ConcentrationUnit,
  to: ConcentrationUnit,
  molecularWeight?: number
): number {
  if (from === to) return value;

  // Handle mass-based conversions if MW is provided
  if (molecularWeight) {
    // Convert to mol/L first
    let molar: number;
    switch (from) {
      case 'gL':
        molar = value / molecularWeight;
        break;
      case 'mgL':
        molar = value / (molecularWeight * 1000);
        break;
      case 'ugL':
        molar = value / (molecularWeight * 1000000);
        break;
      case 'ppm':
        molar = value / (molecularWeight * 1000); // Assuming density ~1 g/mL
        break;
      case 'ppb':
        molar = value / (molecularWeight * 1000000);
        break;
      default:
        molar = value * CONCENTRATION_TO_M[from];
    }

    // Convert from mol/L to target
    switch (to) {
      case 'gL':
        return molar * molecularWeight;
      case 'mgL':
        return molar * molecularWeight * 1000;
      case 'ugL':
        return molar * molecularWeight * 1000000;
      case 'ppm':
        return molar * molecularWeight * 1000;
      case 'ppb':
        return molar * molecularWeight * 1000000;
      default:
        return molar / CONCENTRATION_TO_M[to];
    }
  }

  // Simple conversion without MW (may be approximate)
  const molar = value * CONCENTRATION_TO_M[from];
  return molar / CONCENTRATION_TO_M[to];
}

// ============================================================================
// DENSITY CONVERSIONS
// Base unit: kg/m³
// ============================================================================

const DENSITY_TO_KGM3: Record<DensityUnit, number> = {
  kgm3: 1,
  gcm3: 1000, // 1 g/cm³ = 1000 kg/m³
  gmL: 1000, // Same as g/cm³
  kgL: 1000, // 1 kg/L = 1000 kg/m³
  lbft3: 16.01846337396, // NIST value
  lbgal: 119.8264273167, // US gallon
};

export function convertDensity(
  value: number,
  from: DensityUnit,
  to: DensityUnit
): number {
  if (from === to) return value;
  const kgm3 = value * DENSITY_TO_KGM3[from];
  return kgm3 / DENSITY_TO_KGM3[to];
}

// ============================================================================
// TIME CONVERSIONS
// Base unit: Second (s)
// ============================================================================

const TIME_TO_S: Record<TimeUnit, number> = {
  s: 1,
  ms: 0.001,
  us: 0.000001,
  ns: 0.000000001,
  min: 60,
  h: 3600,
  d: 86400,
};

export function convertTime(
  value: number,
  from: TimeUnit,
  to: TimeUnit
): number {
  if (from === to) return value;
  const seconds = value * TIME_TO_S[from];
  return seconds / TIME_TO_S[to];
}

// ============================================================================
// FLOW RATE CONVERSIONS
// Base unit: m³/s
// ============================================================================

const FLOW_TO_M3S: Record<FlowRateUnit, number> = {
  m3s: 1,
  m3h: 1 / 3600,
  m3d: 1 / 86400,
  Ls: 0.001,
  Lmin: 0.001 / 60,
  Lh: 0.001 / 3600,
  mLmin: 0.000001 / 60,
  gpm: 0.0000630902, // US gallon per minute
  cfm: 0.000471947443, // Cubic feet per minute
  MGD: 0.0438126364, // Million gallons per day (US)
};

export function convertFlowRate(
  value: number,
  from: FlowRateUnit,
  to: FlowRateUnit
): number {
  if (from === to) return value;
  const m3s = value * FLOW_TO_M3S[from];
  return m3s / FLOW_TO_M3S[to];
}

// ============================================================================
// GENERIC CONVERSION FUNCTION
// ============================================================================

export type ConversionCategory =
  | 'temperature'
  | 'pressure'
  | 'volume'
  | 'mass'
  | 'length'
  | 'energy'
  | 'amount'
  | 'concentration'
  | 'density'
  | 'time'
  | 'flowRate';

export function convert<T extends string>(
  value: number,
  from: T,
  to: T,
  category: ConversionCategory,
  options?: { molecularWeight?: number }
): number {
  switch (category) {
    case 'temperature':
      return convertTemperature(value, from as TemperatureUnit, to as TemperatureUnit);
    case 'pressure':
      return convertPressure(value, from as PressureUnit, to as PressureUnit);
    case 'volume':
      return convertVolume(value, from as VolumeUnit, to as VolumeUnit);
    case 'mass':
      return convertMass(value, from as MassUnit, to as MassUnit);
    case 'length':
      return convertLength(value, from as LengthUnit, to as LengthUnit);
    case 'energy':
      return convertEnergy(value, from as EnergyUnit, to as EnergyUnit);
    case 'amount':
      return convertAmount(value, from as AmountUnit, to as AmountUnit);
    case 'concentration':
      return convertConcentration(
        value,
        from as ConcentrationUnit,
        to as ConcentrationUnit,
        options?.molecularWeight
      );
    case 'density':
      return convertDensity(value, from as DensityUnit, to as DensityUnit);
    case 'time':
      return convertTime(value, from as TimeUnit, to as TimeUnit);
    case 'flowRate':
      return convertFlowRate(value, from as FlowRateUnit, to as FlowRateUnit);
    default:
      throw new Error(`Unknown conversion category: ${category}`);
  }
}

// ============================================================================
// CONVERSION WITH UNCERTAINTY PROPAGATION
// ============================================================================

export function convertWithUncertainty(
  value: { value: number; unit: string; uncertainty?: number },
  to: string,
  category: ConversionCategory,
  options?: { molecularWeight?: number }
): { from: typeof value; to: { value: number; unit: string; uncertainty?: number }; factor: number } {
  const convertedValue = convert(value.value, value.unit, to, category, options);
  const factor = value.value !== 0 ? convertedValue / value.value : 0;

  return {
    from: value,
    to: {
      value: convertedValue,
      unit: to,
      uncertainty: value.uncertainty ? Math.abs(value.uncertainty * factor) : undefined,
    },
    factor,
  };
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export function formatValue(
  value: number,
  options?: {
    precision?: number;
    scientific?: boolean;
    significantFigures?: number;
  }
): string {
  const { precision = 4, scientific = false, significantFigures } = options || {};

  if (significantFigures !== undefined) {
    return value.toPrecision(significantFigures);
  }

  if (scientific || Math.abs(value) < 0.001 || Math.abs(value) > 100000) {
    return value.toExponential(precision);
  }

  return value.toFixed(precision).replace(/\.?0+$/, '');
}

export function formatWithUnit(
  value: number,
  unit: string,
  options?: {
    precision?: number;
    scientific?: boolean;
    significantFigures?: number;
  }
): string {
  return `${formatValue(value, options)} ${unit}`;
}

// ============================================================================
// CONVERSION FACTOR LOOKUP
// ============================================================================

export function getConversionFactor<T extends string>(
  from: T,
  to: T,
  category: ConversionCategory
): number {
  return convert(1, from, to, category);
}

// ============================================================================
// BATCH CONVERSION
// ============================================================================

export function batchConvert<T extends string>(
  values: number[],
  from: T,
  to: T,
  category: ConversionCategory,
  options?: { molecularWeight?: number }
): number[] {
  const factor = getConversionFactor(from, to, category);

  // For temperature, we can't use simple multiplication
  if (category === 'temperature') {
    return values.map((v) => convert(v, from, to, category, options));
  }

  return values.map((v) => v * factor);
}

// ============================================================================
// EXPORT CONVERSION FACTORS FOR TESTING
// ============================================================================

export const CONVERSION_FACTORS = {
  PRESSURE_TO_PA,
  VOLUME_TO_L,
  MASS_TO_G,
  LENGTH_TO_M,
  ENERGY_TO_J,
  AMOUNT_TO_MOL,
  DENSITY_TO_KGM3,
  TIME_TO_S,
  FLOW_TO_M3S,
};
