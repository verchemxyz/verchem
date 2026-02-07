/**
 * VerChem Unit System - Type Definitions
 * Supports SI and Imperial/US units for global users
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

// ============================================================================
// UNIT CATEGORIES
// ============================================================================

export type UnitCategory =
  | 'temperature'
  | 'pressure'
  | 'volume'
  | 'mass'
  | 'length'
  | 'energy'
  | 'amount'
  | 'concentration'
  | 'density'
  | 'flowRate'
  | 'time';

// ============================================================================
// UNIT SYSTEMS
// ============================================================================

export type UnitSystem = 'SI' | 'Imperial' | 'Custom';

// ============================================================================
// TEMPERATURE UNITS
// ============================================================================

export type TemperatureUnit = 'C' | 'F' | 'K';

export const TEMPERATURE_UNITS: Record<TemperatureUnit, UnitDefinition> = {
  C: { symbol: '°C', name: 'Celsius', system: 'SI' },
  F: { symbol: '°F', name: 'Fahrenheit', system: 'Imperial' },
  K: { symbol: 'K', name: 'Kelvin', system: 'SI' },
};

// ============================================================================
// PRESSURE UNITS
// ============================================================================

export type PressureUnit = 'atm' | 'Pa' | 'kPa' | 'bar' | 'psi' | 'mmHg' | 'torr' | 'inHg';

export const PRESSURE_UNITS: Record<PressureUnit, UnitDefinition> = {
  atm: { symbol: 'atm', name: 'Atmosphere', system: 'SI' },
  Pa: { symbol: 'Pa', name: 'Pascal', system: 'SI' },
  kPa: { symbol: 'kPa', name: 'Kilopascal', system: 'SI' },
  bar: { symbol: 'bar', name: 'Bar', system: 'SI' },
  psi: { symbol: 'psi', name: 'Pounds per square inch', system: 'Imperial' },
  mmHg: { symbol: 'mmHg', name: 'Millimeters of mercury', system: 'SI' },
  torr: { symbol: 'Torr', name: 'Torr', system: 'SI' },
  inHg: { symbol: 'inHg', name: 'Inches of mercury', system: 'Imperial' },
};

// ============================================================================
// VOLUME UNITS
// ============================================================================

export type VolumeUnit = 'L' | 'mL' | 'uL' | 'm3' | 'cm3' | 'gal' | 'qt' | 'pt' | 'floz' | 'cup';

export const VOLUME_UNITS: Record<VolumeUnit, UnitDefinition> = {
  L: { symbol: 'L', name: 'Liter', system: 'SI' },
  mL: { symbol: 'mL', name: 'Milliliter', system: 'SI' },
  uL: { symbol: 'μL', name: 'Microliter', system: 'SI' },
  m3: { symbol: 'm³', name: 'Cubic meter', system: 'SI' },
  cm3: { symbol: 'cm³', name: 'Cubic centimeter', system: 'SI' },
  gal: { symbol: 'gal', name: 'Gallon (US)', system: 'Imperial' },
  qt: { symbol: 'qt', name: 'Quart (US)', system: 'Imperial' },
  pt: { symbol: 'pt', name: 'Pint (US)', system: 'Imperial' },
  floz: { symbol: 'fl oz', name: 'Fluid ounce (US)', system: 'Imperial' },
  cup: { symbol: 'cup', name: 'Cup (US)', system: 'Imperial' },
};

// ============================================================================
// MASS UNITS
// ============================================================================

export type MassUnit = 'kg' | 'g' | 'mg' | 'ug' | 'lb' | 'oz' | 'ton' | 'tonne';

export const MASS_UNITS: Record<MassUnit, UnitDefinition> = {
  kg: { symbol: 'kg', name: 'Kilogram', system: 'SI' },
  g: { symbol: 'g', name: 'Gram', system: 'SI' },
  mg: { symbol: 'mg', name: 'Milligram', system: 'SI' },
  ug: { symbol: 'μg', name: 'Microgram', system: 'SI' },
  lb: { symbol: 'lb', name: 'Pound', system: 'Imperial' },
  oz: { symbol: 'oz', name: 'Ounce', system: 'Imperial' },
  ton: { symbol: 'ton', name: 'Short ton (US)', system: 'Imperial' },
  tonne: { symbol: 't', name: 'Metric ton', system: 'SI' },
};

// ============================================================================
// LENGTH UNITS
// ============================================================================

export type LengthUnit = 'm' | 'cm' | 'mm' | 'um' | 'nm' | 'pm' | 'A' | 'km' | 'in' | 'ft' | 'yd' | 'mi';

export const LENGTH_UNITS: Record<LengthUnit, UnitDefinition> = {
  m: { symbol: 'm', name: 'Meter', system: 'SI' },
  cm: { symbol: 'cm', name: 'Centimeter', system: 'SI' },
  mm: { symbol: 'mm', name: 'Millimeter', system: 'SI' },
  um: { symbol: 'μm', name: 'Micrometer', system: 'SI' },
  nm: { symbol: 'nm', name: 'Nanometer', system: 'SI' },
  pm: { symbol: 'pm', name: 'Picometer', system: 'SI' },
  A: { symbol: 'Å', name: 'Angstrom', system: 'SI' },
  km: { symbol: 'km', name: 'Kilometer', system: 'SI' },
  in: { symbol: 'in', name: 'Inch', system: 'Imperial' },
  ft: { symbol: 'ft', name: 'Foot', system: 'Imperial' },
  yd: { symbol: 'yd', name: 'Yard', system: 'Imperial' },
  mi: { symbol: 'mi', name: 'Mile', system: 'Imperial' },
};

// ============================================================================
// ENERGY UNITS
// ============================================================================

export type EnergyUnit = 'J' | 'kJ' | 'cal' | 'kcal' | 'eV' | 'BTU' | 'Wh' | 'kWh';

export const ENERGY_UNITS: Record<EnergyUnit, UnitDefinition> = {
  J: { symbol: 'J', name: 'Joule', system: 'SI' },
  kJ: { symbol: 'kJ', name: 'Kilojoule', system: 'SI' },
  cal: { symbol: 'cal', name: 'Calorie', system: 'SI' },
  kcal: { symbol: 'kcal', name: 'Kilocalorie', system: 'SI' },
  eV: { symbol: 'eV', name: 'Electron volt', system: 'SI' },
  BTU: { symbol: 'BTU', name: 'British thermal unit', system: 'Imperial' },
  Wh: { symbol: 'Wh', name: 'Watt-hour', system: 'SI' },
  kWh: { symbol: 'kWh', name: 'Kilowatt-hour', system: 'SI' },
};

// ============================================================================
// AMOUNT UNITS (Moles)
// ============================================================================

export type AmountUnit = 'mol' | 'mmol' | 'umol' | 'nmol' | 'kmol';

export const AMOUNT_UNITS: Record<AmountUnit, UnitDefinition> = {
  mol: { symbol: 'mol', name: 'Mole', system: 'SI' },
  mmol: { symbol: 'mmol', name: 'Millimole', system: 'SI' },
  umol: { symbol: 'μmol', name: 'Micromole', system: 'SI' },
  nmol: { symbol: 'nmol', name: 'Nanomole', system: 'SI' },
  kmol: { symbol: 'kmol', name: 'Kilomole', system: 'SI' },
};

// ============================================================================
// CONCENTRATION UNITS
// ============================================================================

export type ConcentrationUnit = 'M' | 'mM' | 'uM' | 'nM' | 'N' | 'molL' | 'gL' | 'mgL' | 'ugL' | 'ppm' | 'ppb' | 'percent';

export const CONCENTRATION_UNITS: Record<ConcentrationUnit, UnitDefinition> = {
  M: { symbol: 'M', name: 'Molar (mol/L)', system: 'SI' },
  mM: { symbol: 'mM', name: 'Millimolar', system: 'SI' },
  uM: { symbol: 'μM', name: 'Micromolar', system: 'SI' },
  nM: { symbol: 'nM', name: 'Nanomolar', system: 'SI' },
  N: { symbol: 'N', name: 'Normal', system: 'SI' },
  molL: { symbol: 'mol/L', name: 'Mole per liter', system: 'SI' },
  gL: { symbol: 'g/L', name: 'Gram per liter', system: 'SI' },
  mgL: { symbol: 'mg/L', name: 'Milligram per liter', system: 'SI' },
  ugL: { symbol: 'μg/L', name: 'Microgram per liter', system: 'SI' },
  ppm: { symbol: 'ppm', name: 'Parts per million', system: 'SI' },
  ppb: { symbol: 'ppb', name: 'Parts per billion', system: 'SI' },
  percent: { symbol: '%', name: 'Percent', system: 'SI' },
};

// ============================================================================
// DENSITY UNITS
// ============================================================================

export type DensityUnit = 'kgm3' | 'gcm3' | 'gmL' | 'kgL' | 'lbft3' | 'lbgal';

export const DENSITY_UNITS: Record<DensityUnit, UnitDefinition> = {
  kgm3: { symbol: 'kg/m³', name: 'Kilogram per cubic meter', system: 'SI' },
  gcm3: { symbol: 'g/cm³', name: 'Gram per cubic centimeter', system: 'SI' },
  gmL: { symbol: 'g/mL', name: 'Gram per milliliter', system: 'SI' },
  kgL: { symbol: 'kg/L', name: 'Kilogram per liter', system: 'SI' },
  lbft3: { symbol: 'lb/ft³', name: 'Pound per cubic foot', system: 'Imperial' },
  lbgal: { symbol: 'lb/gal', name: 'Pound per gallon', system: 'Imperial' },
};

// ============================================================================
// TIME UNITS
// ============================================================================

export type TimeUnit = 's' | 'ms' | 'us' | 'ns' | 'min' | 'h' | 'd';

export const TIME_UNITS: Record<TimeUnit, UnitDefinition> = {
  s: { symbol: 's', name: 'Second', system: 'SI' },
  ms: { symbol: 'ms', name: 'Millisecond', system: 'SI' },
  us: { symbol: 'μs', name: 'Microsecond', system: 'SI' },
  ns: { symbol: 'ns', name: 'Nanosecond', system: 'SI' },
  min: { symbol: 'min', name: 'Minute', system: 'SI' },
  h: { symbol: 'h', name: 'Hour', system: 'SI' },
  d: { symbol: 'd', name: 'Day', system: 'SI' },
};

// ============================================================================
// FLOW RATE UNITS
// ============================================================================

export type FlowRateUnit = 'm3s' | 'm3h' | 'm3d' | 'Ls' | 'Lmin' | 'Lh' | 'mLmin' | 'gpm' | 'cfm' | 'MGD';

export const FLOW_RATE_UNITS: Record<FlowRateUnit, UnitDefinition> = {
  m3s: { symbol: 'm³/s', name: 'Cubic meter per second', system: 'SI' },
  m3h: { symbol: 'm³/h', name: 'Cubic meter per hour', system: 'SI' },
  m3d: { symbol: 'm³/d', name: 'Cubic meter per day', system: 'SI' },
  Ls: { symbol: 'L/s', name: 'Liter per second', system: 'SI' },
  Lmin: { symbol: 'L/min', name: 'Liter per minute', system: 'SI' },
  Lh: { symbol: 'L/h', name: 'Liter per hour', system: 'SI' },
  mLmin: { symbol: 'mL/min', name: 'Milliliter per minute', system: 'SI' },
  gpm: { symbol: 'gpm', name: 'Gallon per minute (US)', system: 'Imperial' },
  cfm: { symbol: 'cfm', name: 'Cubic feet per minute', system: 'Imperial' },
  MGD: { symbol: 'MGD', name: 'Million gallons per day', system: 'Imperial' },
};

// ============================================================================
// UNIT DEFINITION INTERFACE
// ============================================================================

export interface UnitDefinition {
  symbol: string;
  name: string;
  system: 'SI' | 'Imperial';
}

// ============================================================================
// ALL UNITS TYPE
// ============================================================================

export type AnyUnit =
  | TemperatureUnit
  | PressureUnit
  | VolumeUnit
  | MassUnit
  | LengthUnit
  | EnergyUnit
  | AmountUnit
  | ConcentrationUnit
  | DensityUnit
  | TimeUnit
  | FlowRateUnit;

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UnitPreferences {
  system: UnitSystem;
  temperature: TemperatureUnit;
  pressure: PressureUnit;
  volume: VolumeUnit;
  mass: MassUnit;
  length: LengthUnit;
  energy: EnergyUnit;
  amount: AmountUnit;
  concentration: ConcentrationUnit;
  density: DensityUnit;
  time: TimeUnit;
  flowRate: FlowRateUnit;
}

export const DEFAULT_SI_PREFERENCES: UnitPreferences = {
  system: 'SI',
  temperature: 'C',
  pressure: 'atm',
  volume: 'L',
  mass: 'g',
  length: 'm',
  energy: 'kJ',
  amount: 'mol',
  concentration: 'M',
  density: 'gcm3',
  time: 's',
  flowRate: 'Ls',
};

export const DEFAULT_IMPERIAL_PREFERENCES: UnitPreferences = {
  system: 'Imperial',
  temperature: 'F',
  pressure: 'psi',
  volume: 'gal',
  mass: 'lb',
  length: 'ft',
  energy: 'BTU',
  amount: 'mol', // Moles are universal
  concentration: 'M', // Molarity is universal in chemistry
  density: 'lbgal',
  time: 's',
  flowRate: 'gpm',
};

// ============================================================================
// VALUE WITH UNIT
// ============================================================================

export interface ValueWithUnit<T extends AnyUnit = AnyUnit> {
  value: number;
  unit: T;
  uncertainty?: number;
}

// ============================================================================
// CONVERSION RESULT
// ============================================================================

export interface ConversionResult<T extends AnyUnit = AnyUnit> {
  from: ValueWithUnit<T>;
  to: ValueWithUnit<T>;
  factor: number;
}
