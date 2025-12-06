'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ============================================
// Types
// ============================================
interface UnitCategory {
  name: string
  icon: string
  units: Unit[]
  baseUnit: string
}

interface Unit {
  name: string
  symbol: string
  toBase: (value: number) => number
  fromBase: (value: number) => number
}

// ============================================
// Unit Definitions
// ============================================
const UNIT_CATEGORIES: UnitCategory[] = [
  {
    name: 'Temperature',
    icon: '🌡️',
    baseUnit: 'K',
    units: [
      {
        name: 'Kelvin',
        symbol: 'K',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        name: 'Celsius',
        symbol: '°C',
        toBase: (v) => v + 273.15,
        fromBase: (v) => v - 273.15,
      },
      {
        name: 'Fahrenheit',
        symbol: '°F',
        toBase: (v) => (v - 32) * 5/9 + 273.15,
        fromBase: (v) => (v - 273.15) * 9/5 + 32,
      },
      {
        name: 'Rankine',
        symbol: '°R',
        toBase: (v) => v * 5/9,
        fromBase: (v) => v * 9/5,
      },
    ],
  },
  {
    name: 'Pressure',
    icon: '🎈',
    baseUnit: 'Pa',
    units: [
      {
        name: 'Pascal',
        symbol: 'Pa',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        name: 'Kilopascal',
        symbol: 'kPa',
        toBase: (v) => v * 1000,
        fromBase: (v) => v / 1000,
      },
      {
        name: 'Atmosphere',
        symbol: 'atm',
        toBase: (v) => v * 101325,
        fromBase: (v) => v / 101325,
      },
      {
        name: 'Bar',
        symbol: 'bar',
        toBase: (v) => v * 100000,
        fromBase: (v) => v / 100000,
      },
      {
        name: 'mmHg (Torr)',
        symbol: 'mmHg',
        toBase: (v) => v * 133.322,
        fromBase: (v) => v / 133.322,
      },
      {
        name: 'PSI',
        symbol: 'psi',
        toBase: (v) => v * 6894.76,
        fromBase: (v) => v / 6894.76,
      },
    ],
  },
  {
    name: 'Volume',
    icon: '🧪',
    baseUnit: 'L',
    units: [
      {
        name: 'Liter',
        symbol: 'L',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        name: 'Milliliter',
        symbol: 'mL',
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      {
        name: 'Cubic Meter',
        symbol: 'm³',
        toBase: (v) => v * 1000,
        fromBase: (v) => v / 1000,
      },
      {
        name: 'Cubic Centimeter',
        symbol: 'cm³',
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      {
        name: 'Gallon (US)',
        symbol: 'gal',
        toBase: (v) => v * 3.78541,
        fromBase: (v) => v / 3.78541,
      },
      {
        name: 'Fluid Ounce (US)',
        symbol: 'fl oz',
        toBase: (v) => v * 0.0295735,
        fromBase: (v) => v / 0.0295735,
      },
    ],
  },
  {
    name: 'Mass',
    icon: '⚖️',
    baseUnit: 'g',
    units: [
      {
        name: 'Gram',
        symbol: 'g',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        name: 'Kilogram',
        symbol: 'kg',
        toBase: (v) => v * 1000,
        fromBase: (v) => v / 1000,
      },
      {
        name: 'Milligram',
        symbol: 'mg',
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      {
        name: 'Microgram',
        symbol: 'μg',
        toBase: (v) => v / 1000000,
        fromBase: (v) => v * 1000000,
      },
      {
        name: 'Pound',
        symbol: 'lb',
        toBase: (v) => v * 453.592,
        fromBase: (v) => v / 453.592,
      },
      {
        name: 'Ounce',
        symbol: 'oz',
        toBase: (v) => v * 28.3495,
        fromBase: (v) => v / 28.3495,
      },
      {
        name: 'Atomic Mass Unit',
        symbol: 'u (amu)',
        toBase: (v) => v * 1.66054e-24,
        fromBase: (v) => v / 1.66054e-24,
      },
    ],
  },
  {
    name: 'Concentration',
    icon: '🔬',
    baseUnit: 'M',
    units: [
      {
        name: 'Molar',
        symbol: 'M',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        name: 'Millimolar',
        symbol: 'mM',
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      {
        name: 'Micromolar',
        symbol: 'μM',
        toBase: (v) => v / 1000000,
        fromBase: (v) => v * 1000000,
      },
      {
        name: 'Nanomolar',
        symbol: 'nM',
        toBase: (v) => v / 1000000000,
        fromBase: (v) => v * 1000000000,
      },
      {
        name: 'Normal',
        symbol: 'N',
        toBase: (v) => v, // Same as M for monoprotic
        fromBase: (v) => v,
      },
      {
        name: 'Molal',
        symbol: 'm',
        toBase: (v) => v, // Approximation (assumes dilute solution)
        fromBase: (v) => v,
      },
      {
        name: 'Parts per Million',
        symbol: 'ppm',
        toBase: (v) => v / 1000000, // Approximation
        fromBase: (v) => v * 1000000,
      },
      {
        name: 'Percent (w/v)',
        symbol: '% w/v',
        toBase: (v) => v / 100, // Approximation
        fromBase: (v) => v * 100,
      },
    ],
  },
  {
    name: 'Energy',
    icon: '⚡',
    baseUnit: 'J',
    units: [
      {
        name: 'Joule',
        symbol: 'J',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        name: 'Kilojoule',
        symbol: 'kJ',
        toBase: (v) => v * 1000,
        fromBase: (v) => v / 1000,
      },
      {
        name: 'Calorie',
        symbol: 'cal',
        toBase: (v) => v * 4.184,
        fromBase: (v) => v / 4.184,
      },
      {
        name: 'Kilocalorie',
        symbol: 'kcal',
        toBase: (v) => v * 4184,
        fromBase: (v) => v / 4184,
      },
      {
        name: 'Electron Volt',
        symbol: 'eV',
        toBase: (v) => v * 1.60218e-19,
        fromBase: (v) => v / 1.60218e-19,
      },
      {
        name: 'kJ/mol',
        symbol: 'kJ/mol',
        toBase: (v) => v * 1000 / 6.022e23,
        fromBase: (v) => v * 6.022e23 / 1000,
      },
      {
        name: 'kcal/mol',
        symbol: 'kcal/mol',
        toBase: (v) => v * 4184 / 6.022e23,
        fromBase: (v) => v * 6.022e23 / 4184,
      },
    ],
  },
  {
    name: 'Amount',
    icon: '🔢',
    baseUnit: 'mol',
    units: [
      {
        name: 'Mole',
        symbol: 'mol',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        name: 'Millimole',
        symbol: 'mmol',
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      {
        name: 'Micromole',
        symbol: 'μmol',
        toBase: (v) => v / 1000000,
        fromBase: (v) => v * 1000000,
      },
      {
        name: 'Nanomole',
        symbol: 'nmol',
        toBase: (v) => v / 1000000000,
        fromBase: (v) => v * 1000000000,
      },
      {
        name: 'Particles',
        symbol: 'particles',
        toBase: (v) => v / 6.02214076e23,
        fromBase: (v) => v * 6.02214076e23,
      },
    ],
  },
]

// ============================================
// Format Number
// ============================================
function formatNumber(num: number): string {
  if (num === 0) return '0'
  if (Math.abs(num) < 0.0001 || Math.abs(num) >= 1e10) {
    return num.toExponential(6)
  }
  // Round to 8 significant figures
  const precision = 8
  const magnitude = Math.floor(Math.log10(Math.abs(num)))
  const rounded = Math.round(num * Math.pow(10, precision - magnitude - 1)) / Math.pow(10, precision - magnitude - 1)
  return rounded.toString()
}

// ============================================
// Component
// ============================================
export default function UnitConverterPage() {
  const [selectedCategory, setSelectedCategory] = useState(UNIT_CATEGORIES[0])
  const [fromUnit, setFromUnit] = useState(selectedCategory.units[0])
  const [toUnit, setToUnit] = useState(selectedCategory.units[1])
  const [inputValue, setInputValue] = useState('1')

  // Calculate conversion
  const result = useMemo(() => {
    const value = parseFloat(inputValue)
    if (isNaN(value)) return ''

    const baseValue = fromUnit.toBase(value)
    const convertedValue = toUnit.fromBase(baseValue)
    return formatNumber(convertedValue)
  }, [inputValue, fromUnit, toUnit])

  // All conversions for display
  const allConversions = useMemo(() => {
    const value = parseFloat(inputValue)
    if (isNaN(value)) return []

    const baseValue = fromUnit.toBase(value)
    return selectedCategory.units.map(unit => ({
      unit,
      value: formatNumber(unit.fromBase(baseValue)),
    }))
  }, [inputValue, fromUnit, selectedCategory])

  // Handle category change
  const handleCategoryChange = (category: UnitCategory) => {
    setSelectedCategory(category)
    setFromUnit(category.units[0])
    setToUnit(category.units[1])
    setInputValue('1')
  }

  // Swap units
  const handleSwap = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">VerChem</h1>
              <p className="text-xs text-purple-300">Unit Converter</p>
            </div>
          </Link>
          <Link href="/" className="text-purple-300 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Chemistry Unit Converter
          </h1>
          <p className="text-purple-300">
            Convert between units commonly used in chemistry
          </p>
        </div>

        {/* Category Selection */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {UNIT_CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                selectedCategory.name === category.name
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Main Converter */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-purple-500/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-end">
            {/* From */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">From</label>
              <div className="space-y-3">
                <select
                  value={fromUnit.symbol}
                  onChange={(e) => setFromUnit(selectedCategory.units.find(u => u.symbol === e.target.value)!)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {selectedCategory.units.map((unit) => (
                    <option key={unit.symbol} value={unit.symbol}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter value"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="w-14 h-14 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl transition-all shadow-lg hover:shadow-purple-500/30"
                title="Swap units"
              >
                ⇄
              </button>
            </div>

            {/* To */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">To</label>
              <div className="space-y-3">
                <select
                  value={toUnit.symbol}
                  onChange={(e) => setToUnit(selectedCategory.units.find(u => u.symbol === e.target.value)!)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {selectedCategory.units.map((unit) => (
                    <option key={unit.symbol} value={unit.symbol}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
                <div className="w-full px-4 py-4 bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500/50 rounded-xl text-white text-2xl font-mono">
                  {result || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Formula */}
          <div className="mt-6 text-center text-purple-300 text-sm">
            {inputValue && result && (
              <span>
                {inputValue} {fromUnit.symbol} = {result} {toUnit.symbol}
              </span>
            )}
          </div>
        </div>

        {/* All Conversions Table */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-purple-500/20">
          <h3 className="text-xl font-bold text-white mb-4">
            All {selectedCategory.name} Conversions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allConversions.map(({ unit, value }) => (
              <div
                key={unit.symbol}
                className={`p-4 rounded-xl transition-all ${
                  unit.symbol === fromUnit.symbol
                    ? 'bg-purple-600/30 border border-purple-500'
                    : 'bg-slate-700/50 hover:bg-slate-700'
                }`}
              >
                <div className="text-slate-400 text-sm">{unit.name}</div>
                <div className="text-white font-mono text-lg">
                  {value} <span className="text-purple-300">{unit.symbol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Conversions Reference */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-purple-500/20">
          <h3 className="text-xl font-bold text-white mb-4">
            Quick Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-purple-300 font-semibold mb-2">🌡️ Temperature</h4>
              <ul className="text-slate-300 space-y-1">
                <li>0°C = 273.15 K = 32°F</li>
                <li>25°C = 298.15 K = 77°F</li>
                <li>100°C = 373.15 K = 212°F</li>
              </ul>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-purple-300 font-semibold mb-2">🎈 Pressure</h4>
              <ul className="text-slate-300 space-y-1">
                <li>1 atm = 101.325 kPa</li>
                <li>1 atm = 760 mmHg (Torr)</li>
                <li>1 bar = 100 kPa</li>
              </ul>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-purple-300 font-semibold mb-2">⚡ Energy</h4>
              <ul className="text-slate-300 space-y-1">
                <li>1 cal = 4.184 J</li>
                <li>1 eV = 96.485 kJ/mol</li>
                <li>1 kcal/mol = 4.184 kJ/mol</li>
              </ul>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-purple-300 font-semibold mb-2">🔢 Amount</h4>
              <ul className="text-slate-300 space-y-1">
                <li>1 mol = 6.022 × 10²³ particles</li>
                <li>Avogadro&apos;s number: Nₐ</li>
                <li>1 mmol = 0.001 mol</li>
              </ul>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-purple-300 font-semibold mb-2">🧪 Volume</h4>
              <ul className="text-slate-300 space-y-1">
                <li>1 L = 1000 mL = 1 dm³</li>
                <li>1 mL = 1 cm³</li>
                <li>STP molar volume = 22.4 L/mol</li>
              </ul>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-purple-300 font-semibold mb-2">🔬 Concentration</h4>
              <ul className="text-slate-300 space-y-1">
                <li>1 M = 1 mol/L</li>
                <li>1 mM = 10⁻³ M</li>
                <li>1 ppm ≈ 1 mg/L (dilute)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-slate-900/80 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-purple-300">
          <p>VerChem Unit Converter - Accurate conversions for chemistry</p>
        </div>
      </footer>
    </div>
  )
}
