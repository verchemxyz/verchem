'use client'

// VerChem - Element Detail Modal Component

import ElementVisual from './ElementVisual'
import ElementStructurePreview from './ElementStructurePreview'
import type { Element } from '@/lib/types/chemistry'

interface ElementModalProps {
  element: Element
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'alkali-metal': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900' },
  'alkaline-earth-metal': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-900' },
  'transition-metal': { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900' },
  'post-transition-metal': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' },
  'metalloid': { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-900' },
  'nonmetal': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' },
  'halogen': { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-900' },
  'noble-gas': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900' },
  'lanthanide': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-900' },
  'actinide': { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-900' },
  'unknown': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-900' },
}

export default function ElementModal({ element, onClose }: ElementModalProps) {
  const colors = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${colors.bg} ${colors.border} border-b-4 p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 ${colors.bg} ${colors.border} ${colors.text} border-4 rounded-lg flex flex-col items-center justify-center`}
              >
                <div className="text-sm font-medium">{element.atomicNumber}</div>
                <div className="text-3xl font-bold">{element.symbol}</div>
              </div>
              <div>
                <h2 className={`text-3xl font-bold ${colors.text}`}>
                  {element.name}
                </h2>
                <p className="text-gray-600 capitalize">
                  {element.category.replace(/-/g, ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Visual */}
          <div className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <ElementVisual element={element} />
              <ElementStructurePreview element={element} />
            </div>
            <p className="text-xs text-gray-500">
              ภาพด้านซ้ายคือการกระจายตัวของอิเล็กตรอน ส่วนด้านขวาเป็นตัวอย่างรูปพันธะ/โมเลกุลที่พบบ่อยของ{' '}
              {element.name} เพื่อช่วยจับคู่โครงสร้างกับสมบัติได้เร็วขึ้น
            </p>
          </div>

          {/* Basic Properties */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Basic Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-600">Atomic Mass</div>
                <div className="text-xl font-bold text-gray-900">
                  {element.atomicMass.toFixed(3)} u
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-600">Group / Period</div>
                <div className="text-xl font-bold text-gray-900">
                  {element.group || '—'} / {element.period}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-600">Block</div>
                <div className="text-xl font-bold text-gray-900 uppercase">{element.block}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-600">Standard State</div>
                <div className="text-xl font-bold text-gray-900 capitalize">
                  {element.standardState}
                </div>
              </div>
            </div>
          </div>

          {/* Electron Configuration */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Electron Configuration</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <code className="text-base font-mono font-semibold text-blue-900">
                {element.electronConfiguration}
              </code>
            </div>
          </div>

          {/* Physical Properties */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Physical Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              {element.meltingPoint && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Melting Point</div>
                  <div className="text-lg font-bold text-gray-900">
                    {element.meltingPoint.toFixed(2)} K
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    {(element.meltingPoint - 273.15).toFixed(2)} °C
                  </div>
                </div>
              )}
              {element.boilingPoint && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Boiling Point</div>
                  <div className="text-lg font-bold text-gray-900">
                    {element.boilingPoint.toFixed(2)} K
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    {(element.boilingPoint - 273.15).toFixed(2)} °C
                  </div>
                </div>
              )}
              {element.density && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Density</div>
                  <div className="text-lg font-bold text-gray-900">
                    {element.density.toFixed(3)} g/cm³
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Atomic Properties */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Atomic Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              {element.electronegativity && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Electronegativity</div>
                  <div className="text-lg font-bold text-gray-900">
                    {element.electronegativity.toFixed(2)}
                  </div>
                  <div className="text-xs font-medium text-gray-500">Pauling scale</div>
                </div>
              )}
              {element.ionizationEnergy && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Ionization Energy</div>
                  <div className="text-lg font-bold text-gray-900">
                    {element.ionizationEnergy.toFixed(2)} kJ/mol
                  </div>
                </div>
              )}
              {element.electronAffinity && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Electron Affinity</div>
                  <div className="text-lg font-bold text-gray-900">
                    {element.electronAffinity.toFixed(2)} kJ/mol
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-600">Oxidation States</div>
                <div className="text-lg font-bold text-gray-900">
                  {element.oxidationStates.join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Atomic Radii */}
          {(element.atomicRadius ||
            element.covalentRadius ||
            element.vanDerWaalsRadius) && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Atomic Radii</h3>
              <div className="grid grid-cols-3 gap-4">
                {element.atomicRadius && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-600">Atomic</div>
                    <div className="text-lg font-bold text-gray-900">
                      {element.atomicRadius} pm
                    </div>
                  </div>
                )}
                {element.covalentRadius && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-600">Covalent</div>
                    <div className="text-lg font-bold text-gray-900">
                      {element.covalentRadius} pm
                    </div>
                  </div>
                )}
                {element.vanDerWaalsRadius && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-600">Van der Waals</div>
                    <div className="text-lg font-bold text-gray-900">
                      {element.vanDerWaalsRadius} pm
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discovery */}
          {(element.discoveryYear || element.discoverer) && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Discovery</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  {element.discoveryYear && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Year</div>
                      <div className="text-lg font-bold text-gray-900">
                        {element.discoveryYear}
                      </div>
                    </div>
                  )}
                  {element.discoverer && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Discoverer</div>
                      <div className="text-lg font-bold text-gray-900">{element.discoverer}</div>
                    </div>
                  )}
                </div>
                {element.nameMeaning && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-600">Name Meaning</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {element.nameMeaning}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
