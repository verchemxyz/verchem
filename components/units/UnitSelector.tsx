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
import type { UnitCategory, ConversionCategory } from '@/lib/units';

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
          bg-muted hover:bg-border
          text-foreground ${className}`}
        title={`Switch to ${system === 'SI' ? 'Imperial' : 'SI'} units`}
      >
        <span className={system === 'SI' ? 'text-primary-600' : 'text-muted-foreground'}>
          SI
        </span>
        <span className="text-muted-foreground">/</span>
        <span className={system === 'Imperial' ? 'text-secondary-strong' : 'text-muted-foreground'}>
          US
        </span>
      </button>
    );
  }

  return (
    <div className={`inline-flex rounded-lg bg-muted p-1 ${className}`}>
      <button
        onClick={() => setSystem('SI')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          system === 'SI'
            ? 'bg-card text-primary-600 shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        SI (Metric)
      </button>
      <button
        onClick={() => setSystem('Imperial')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          system === 'Imperial'
            ? 'bg-card text-secondary-strong shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
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
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        value={currentUnit}
        onChange={(e) => setUnit(category, e.target.value)}
        className="px-3 py-2 rounded-lg border border-border
          bg-card text-foreground
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
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
  const { system, setSystem: _setSystem, resetToDefaults } = useUnits();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-card rounded-lg border border-border ${className}`}>
      {showTitle && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Unit Preferences</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred unit system
          </p>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Quick System Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Unit System</span>
          <UnitSystemToggle />
        </div>

        {/* Current System Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              system === 'SI'
                ? 'bg-primary-100 text-primary-700'
                : system === 'Imperial'
                ? 'bg-secondary-100 text-secondary-700'
                : 'bg-warning/10 text-warning-strong'
            }`}
          >
            {system === 'SI' ? 'Metric (SI)' : system === 'Imperial' ? 'US/Imperial' : 'Custom'}
          </span>
          {system === 'Custom' && (
            <button
              onClick={resetToDefaults}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset to SI
            </button>
          )}
        </div>

        {/* Expand/Collapse for detailed settings */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
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
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
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
      : convertValue(value, baseUnit, preferredUnit, category as ConversionCategory);

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
        <span className="text-muted-foreground text-sm ml-1">
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
