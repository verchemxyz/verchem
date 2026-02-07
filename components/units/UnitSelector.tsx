'use client';

/**
 * VerChem Unit System - Unit Selector Component
 * Allows users to switch between SI and Imperial units
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

import React, { useState } from 'react';
import { useUnits } from '@/lib/units';
import type { UnitSystem, UnitCategory } from '@/lib/units';

// ============================================================================
// QUICK TOGGLE (SI/Imperial)
// ============================================================================

interface UnitSystemToggleProps {
  className?: string;
  compact?: boolean;
}

export function UnitSystemToggle({ className = '', compact = false }: UnitSystemToggleProps) {
  const { system, setSystem } = useUnits();

  const handleToggle = () => {
    setSystem(system === 'SI' ? 'Imperial' : 'SI');
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors
          bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-300 ${className}`}
        title={`Switch to ${system === 'SI' ? 'Imperial' : 'SI'} units`}
      >
        <span className={system === 'SI' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}>
          SI
        </span>
        <span className="text-gray-400 dark:text-gray-500">/</span>
        <span className={system === 'Imperial' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}>
          US
        </span>
      </button>
    );
  }

  return (
    <div className={`inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}>
      <button
        onClick={() => setSystem('SI')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          system === 'SI'
            ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        SI (Metric)
      </button>
      <button
        onClick={() => setSystem('Imperial')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          system === 'Imperial'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        US (Imperial)
      </button>
    </div>
  );
}

// ============================================================================
// UNIT CATEGORY SELECTOR
// ============================================================================

interface UnitCategorySelectorProps {
  category: UnitCategory;
  label?: string;
  className?: string;
}

const UNIT_OPTIONS: Record<UnitCategory, Array<{ value: string; label: string; system: 'SI' | 'Imperial' }>> = {
  temperature: [
    { value: 'C', label: '°C (Celsius)', system: 'SI' },
    { value: 'F', label: '°F (Fahrenheit)', system: 'Imperial' },
    { value: 'K', label: 'K (Kelvin)', system: 'SI' },
  ],
  pressure: [
    { value: 'atm', label: 'atm', system: 'SI' },
    { value: 'kPa', label: 'kPa', system: 'SI' },
    { value: 'bar', label: 'bar', system: 'SI' },
    { value: 'psi', label: 'psi', system: 'Imperial' },
    { value: 'mmHg', label: 'mmHg', system: 'SI' },
  ],
  volume: [
    { value: 'L', label: 'L (Liter)', system: 'SI' },
    { value: 'mL', label: 'mL', system: 'SI' },
    { value: 'm3', label: 'm³', system: 'SI' },
    { value: 'gal', label: 'gal (US)', system: 'Imperial' },
    { value: 'qt', label: 'qt (US)', system: 'Imperial' },
    { value: 'floz', label: 'fl oz (US)', system: 'Imperial' },
  ],
  mass: [
    { value: 'g', label: 'g (Gram)', system: 'SI' },
    { value: 'kg', label: 'kg', system: 'SI' },
    { value: 'mg', label: 'mg', system: 'SI' },
    { value: 'lb', label: 'lb (Pound)', system: 'Imperial' },
    { value: 'oz', label: 'oz (Ounce)', system: 'Imperial' },
  ],
  length: [
    { value: 'm', label: 'm (Meter)', system: 'SI' },
    { value: 'cm', label: 'cm', system: 'SI' },
    { value: 'mm', label: 'mm', system: 'SI' },
    { value: 'nm', label: 'nm', system: 'SI' },
    { value: 'A', label: 'Å (Angstrom)', system: 'SI' },
    { value: 'ft', label: 'ft (Foot)', system: 'Imperial' },
    { value: 'in', label: 'in (Inch)', system: 'Imperial' },
  ],
  energy: [
    { value: 'kJ', label: 'kJ', system: 'SI' },
    { value: 'J', label: 'J (Joule)', system: 'SI' },
    { value: 'cal', label: 'cal', system: 'SI' },
    { value: 'kcal', label: 'kcal', system: 'SI' },
    { value: 'eV', label: 'eV', system: 'SI' },
    { value: 'BTU', label: 'BTU', system: 'Imperial' },
  ],
  amount: [
    { value: 'mol', label: 'mol', system: 'SI' },
    { value: 'mmol', label: 'mmol', system: 'SI' },
    { value: 'kmol', label: 'kmol', system: 'SI' },
  ],
  concentration: [
    { value: 'M', label: 'M (Molar)', system: 'SI' },
    { value: 'mM', label: 'mM', system: 'SI' },
    { value: 'mgL', label: 'mg/L', system: 'SI' },
    { value: 'ppm', label: 'ppm', system: 'SI' },
    { value: 'percent', label: '%', system: 'SI' },
  ],
  density: [
    { value: 'gcm3', label: 'g/cm³', system: 'SI' },
    { value: 'kgm3', label: 'kg/m³', system: 'SI' },
    { value: 'lbgal', label: 'lb/gal', system: 'Imperial' },
    { value: 'lbft3', label: 'lb/ft³', system: 'Imperial' },
  ],
  time: [
    { value: 's', label: 's (Second)', system: 'SI' },
    { value: 'min', label: 'min', system: 'SI' },
    { value: 'h', label: 'h (Hour)', system: 'SI' },
    { value: 'ms', label: 'ms', system: 'SI' },
  ],
  flowRate: [
    { value: 'Ls', label: 'L/s', system: 'SI' },
    { value: 'm3h', label: 'm³/h', system: 'SI' },
    { value: 'm3d', label: 'm³/d', system: 'SI' },
    { value: 'gpm', label: 'gpm (US)', system: 'Imperial' },
    { value: 'MGD', label: 'MGD', system: 'Imperial' },
  ],
};

export function UnitCategorySelector({ category, label, className = '' }: UnitCategorySelectorProps) {
  const { preferences, setUnit } = useUnits();
  const currentUnit = preferences[category as keyof typeof preferences] as string;
  const options = UNIT_OPTIONS[category] || [];

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        value={currentUnit}
        onChange={(e) => setUnit(category, e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-teal-500 focus:border-teal-500
          text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} {opt.system === 'Imperial' ? '(US)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// FULL UNIT PREFERENCES PANEL
// ============================================================================

interface UnitPreferencesPanelProps {
  className?: string;
  showTitle?: boolean;
}

export function UnitPreferencesPanel({ className = '', showTitle = true }: UnitPreferencesPanelProps) {
  const { system, setSystem, resetToDefaults } = useUnits();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {showTitle && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Unit Preferences</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose your preferred unit system
          </p>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Quick System Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit System</span>
          <UnitSystemToggle />
        </div>

        {/* Current System Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              system === 'SI'
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                : system === 'Imperial'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            }`}
          >
            {system === 'SI' ? 'Metric (SI)' : system === 'Imperial' ? 'US/Imperial' : 'Custom'}
          </span>
          {system === 'Custom' && (
            <button
              onClick={resetToDefaults}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Reset to SI
            </button>
          )}
        </div>

        {/* Expand/Collapse for detailed settings */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {isExpanded ? 'Hide' : 'Show'} detailed settings
        </button>

        {/* Detailed Settings */}
        {isExpanded && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <UnitCategorySelector category="temperature" label="Temperature" />
            <UnitCategorySelector category="pressure" label="Pressure" />
            <UnitCategorySelector category="volume" label="Volume" />
            <UnitCategorySelector category="mass" label="Mass" />
            <UnitCategorySelector category="length" label="Length" />
            <UnitCategorySelector category="energy" label="Energy" />
            <UnitCategorySelector category="concentration" label="Concentration" />
            <UnitCategorySelector category="flowRate" label="Flow Rate" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// INLINE UNIT DISPLAY (for showing converted values)
// ============================================================================

interface UnitValueDisplayProps {
  value: number;
  baseUnit: string;
  category: UnitCategory;
  precision?: number;
  showBothSystems?: boolean;
  className?: string;
}

export function UnitValueDisplay({
  value,
  baseUnit,
  category,
  precision = 4,
  showBothSystems = false,
  className = '',
}: UnitValueDisplayProps) {
  const { preferences, convertValue, getUnitSymbol } = useUnits();
  const preferredUnit = preferences[category as keyof typeof preferences] as string;

  // If base unit is same as preferred, no conversion needed
  const displayValue =
    baseUnit === preferredUnit
      ? value
      : convertValue(value, baseUnit, preferredUnit, category as any);

  const symbol = getUnitSymbol(preferredUnit, category);

  // Format number
  const formatted =
    Math.abs(displayValue) < 0.001 || Math.abs(displayValue) > 100000
      ? displayValue.toExponential(precision)
      : displayValue.toFixed(precision).replace(/\.?0+$/, '');

  if (showBothSystems && baseUnit !== preferredUnit) {
    const originalFormatted =
      Math.abs(value) < 0.001 || Math.abs(value) > 100000
        ? value.toExponential(precision)
        : value.toFixed(precision).replace(/\.?0+$/, '');

    return (
      <span className={className}>
        <span className="font-medium">{formatted} {symbol}</span>
        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
          ({originalFormatted} {getUnitSymbol(baseUnit, category)})
        </span>
      </span>
    );
  }

  return (
    <span className={className}>
      {formatted} {symbol}
    </span>
  );
}
