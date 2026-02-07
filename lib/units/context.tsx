'use client';

/**
 * VerChem Unit System - React Context
 * Provides unit preferences throughout the app
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState, useRef } from 'react';
import type {
  UnitSystem,
  UnitPreferences,
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
  UnitCategory,
} from './types';
import {
  DEFAULT_SI_PREFERENCES,
  DEFAULT_IMPERIAL_PREFERENCES,
} from './types';
import {
  convert,
  convertTemperature,
  formatValue,
  formatWithUnit,
  type ConversionCategory,
} from './conversions';

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface UnitContextType {
  // Current preferences
  preferences: UnitPreferences;
  system: UnitSystem;

  // Setters
  setSystem: (system: UnitSystem) => void;
  setPreferences: (prefs: Partial<UnitPreferences>) => void;
  setUnit: <T extends UnitCategory>(category: T, unit: string) => void;
  resetToDefaults: () => void;

  // Conversion helpers
  convertValue: (
    value: number,
    from: string,
    to: string,
    category: ConversionCategory
  ) => number;

  // Format helpers
  formatWithPreferredUnit: (
    value: number,
    baseUnit: string,
    category: ConversionCategory,
    options?: { precision?: number }
  ) => string;

  // Get preferred unit for category
  getPreferredUnit: (category: UnitCategory) => string;

  // Get unit symbol
  getUnitSymbol: (unit: string, category: UnitCategory) => string;
}

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'verchem_unit_preferences';

// ============================================================================
// UNIT SYMBOLS MAP
// ============================================================================

const UNIT_SYMBOLS: Record<string, string> = {
  // Temperature
  C: '°C',
  F: '°F',
  K: 'K',
  // Pressure
  atm: 'atm',
  Pa: 'Pa',
  kPa: 'kPa',
  bar: 'bar',
  psi: 'psi',
  mmHg: 'mmHg',
  torr: 'Torr',
  inHg: 'inHg',
  // Volume
  L: 'L',
  mL: 'mL',
  uL: 'μL',
  m3: 'm³',
  cm3: 'cm³',
  gal: 'gal',
  qt: 'qt',
  pt: 'pt',
  floz: 'fl oz',
  cup: 'cup',
  // Mass
  kg: 'kg',
  g: 'g',
  mg: 'mg',
  ug: 'μg',
  lb: 'lb',
  oz: 'oz',
  ton: 'ton',
  tonne: 't',
  // Length
  m: 'm',
  cm: 'cm',
  mm: 'mm',
  um: 'μm',
  nm: 'nm',
  pm: 'pm',
  A: 'Å',
  km: 'km',
  in: 'in',
  ft: 'ft',
  yd: 'yd',
  mi: 'mi',
  // Energy
  J: 'J',
  kJ: 'kJ',
  cal: 'cal',
  kcal: 'kcal',
  eV: 'eV',
  BTU: 'BTU',
  Wh: 'Wh',
  kWh: 'kWh',
  // Amount
  mol: 'mol',
  mmol: 'mmol',
  umol: 'μmol',
  nmol: 'nmol',
  kmol: 'kmol',
  // Concentration
  M: 'M',
  mM: 'mM',
  uM: 'μM',
  nM: 'nM',
  N: 'N',
  molL: 'mol/L',
  gL: 'g/L',
  mgL: 'mg/L',
  ugL: 'μg/L',
  ppm: 'ppm',
  ppb: 'ppb',
  percent: '%',
  // Density
  kgm3: 'kg/m³',
  gcm3: 'g/cm³',
  gmL: 'g/mL',
  kgL: 'kg/L',
  lbft3: 'lb/ft³',
  lbgal: 'lb/gal',
  // Time
  s: 's',
  ms: 'ms',
  us: 'μs',
  ns: 'ns',
  min: 'min',
  h: 'h',
  d: 'd',
  // Flow Rate
  m3s: 'm³/s',
  m3h: 'm³/h',
  m3d: 'm³/d',
  Ls: 'L/s',
  Lmin: 'L/min',
  Lh: 'L/h',
  mLmin: 'mL/min',
  gpm: 'gpm',
  cfm: 'cfm',
  MGD: 'MGD',
};

// ============================================================================
// CREATE CONTEXT
// ============================================================================

const UnitContext = createContext<UnitContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface UnitProviderProps {
  children: React.ReactNode;
  initialPreferences?: Partial<UnitPreferences>;
}

export function UnitProvider({ children, initialPreferences }: UnitProviderProps) {
  // Lazy initialization: load from localStorage if available
  const [preferences, setPreferencesState] = useState<UnitPreferences>(() => {
    const base = { ...DEFAULT_SI_PREFERENCES, ...initialPreferences };
    if (typeof window === 'undefined') return base;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...base, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore storage errors
    }
    return base;
  });

  const isHydratedRef = useRef(typeof window !== 'undefined');

  // Mark hydrated after mount (for SSR case)
  useEffect(() => {
    isHydratedRef.current = true;
  }, []);

  // Save to localStorage when preferences change
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage errors
    }
  }, [preferences]);

  // Set entire system (SI or Imperial)
  const setSystem = useCallback((system: UnitSystem) => {
    if (system === 'SI') {
      setPreferencesState(DEFAULT_SI_PREFERENCES);
    } else if (system === 'Imperial') {
      setPreferencesState(DEFAULT_IMPERIAL_PREFERENCES);
    } else {
      setPreferencesState((prev) => ({ ...prev, system }));
    }
  }, []);

  // Update specific preferences
  const setPreferences = useCallback((prefs: Partial<UnitPreferences>) => {
    setPreferencesState((prev) => ({
      ...prev,
      ...prefs,
      system: 'Custom', // When manually setting, switch to Custom
    }));
  }, []);

  // Set a single unit
  const setUnit = useCallback(<T extends UnitCategory>(category: T, unit: string) => {
    setPreferencesState((prev) => ({
      ...prev,
      [category]: unit,
      system: 'Custom',
    }));
  }, []);

  // Reset to SI defaults
  const resetToDefaults = useCallback(() => {
    setPreferencesState(DEFAULT_SI_PREFERENCES);
  }, []);

  // Convert value
  const convertValue = useCallback(
    (value: number, from: string, to: string, category: ConversionCategory) => {
      return convert(value, from, to, category);
    },
    []
  );

  // Format with preferred unit
  const formatWithPreferredUnit = useCallback(
    (
      value: number,
      baseUnit: string,
      category: ConversionCategory,
      options?: { precision?: number }
    ) => {
      const preferredUnit = preferences[category as keyof UnitPreferences] as string;

      // If base unit is same as preferred, no conversion needed
      if (baseUnit === preferredUnit) {
        return formatWithUnit(value, UNIT_SYMBOLS[baseUnit] || baseUnit, options);
      }

      // Convert and format
      const converted = convert(value, baseUnit, preferredUnit, category);
      return formatWithUnit(converted, UNIT_SYMBOLS[preferredUnit] || preferredUnit, options);
    },
    [preferences]
  );

  // Get preferred unit for category
  const getPreferredUnit = useCallback(
    (category: UnitCategory) => {
      return preferences[category as keyof UnitPreferences] as string;
    },
    [preferences]
  );

  // Get unit symbol
  const getUnitSymbol = useCallback((unit: string, _category: UnitCategory) => {
    return UNIT_SYMBOLS[unit] || unit;
  }, []);

  // Memoize context value
  const value = useMemo<UnitContextType>(
    () => ({
      preferences,
      system: preferences.system,
      setSystem,
      setPreferences,
      setUnit,
      resetToDefaults,
      convertValue,
      formatWithPreferredUnit,
      getPreferredUnit,
      getUnitSymbol,
    }),
    [
      preferences,
      setSystem,
      setPreferences,
      setUnit,
      resetToDefaults,
      convertValue,
      formatWithPreferredUnit,
      getPreferredUnit,
      getUnitSymbol,
    ]
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useUnits(): UnitContextType {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
}

// ============================================================================
// UTILITY HOOK: useUnitConversion
// ============================================================================

export function useUnitConversion(category: ConversionCategory) {
  const { preferences, convertValue, getUnitSymbol } = useUnits();
  const preferredUnit = preferences[category as keyof UnitPreferences] as string;

  const convertToPreferred = useCallback(
    (value: number, fromUnit: string) => {
      if (fromUnit === preferredUnit) return value;
      return convertValue(value, fromUnit, preferredUnit, category);
    },
    [convertValue, preferredUnit, category]
  );

  const convertFromPreferred = useCallback(
    (value: number, toUnit: string) => {
      if (toUnit === preferredUnit) return value;
      return convertValue(value, preferredUnit, toUnit, category);
    },
    [convertValue, preferredUnit, category]
  );

  const formatValue = useCallback(
    (value: number, fromUnit: string, options?: { precision?: number }) => {
      const converted = convertToPreferred(value, fromUnit);
      const symbol = getUnitSymbol(preferredUnit, category as UnitCategory);
      const precision = options?.precision ?? 4;
      return `${converted.toFixed(precision).replace(/\.?0+$/, '')} ${symbol}`;
    },
    [convertToPreferred, getUnitSymbol, preferredUnit, category]
  );

  return {
    preferredUnit,
    symbol: getUnitSymbol(preferredUnit, category as UnitCategory),
    convertToPreferred,
    convertFromPreferred,
    formatValue,
  };
}
