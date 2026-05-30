'use client'

// VerChem - Element Detail Modal Component

import ElementVisual from './ElementVisual'
import ElementStructurePreview from './ElementStructurePreview'
import type { Element } from '@/lib/types/chemistry'

interface ElementModalProps {
  element: Element
  onClose: () => void
}

// Element-category codings (SEMANTIC) — neutral surface + per-category element
// token so categories stay visually distinct AND theme-safe (light/dark).
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'alkali-metal': { bg: 'bg-muted', border: 'border-element-alkali', text: 'text-element-alkali' },
  'alkaline-earth-metal': { bg: 'bg-muted', border: 'border-element-alkaline', text: 'text-element-alkaline' },
  'transition-metal': { bg: 'bg-muted', border: 'border-element-transition', text: 'text-element-transition' },
  'post-transition-metal': { bg: 'bg-muted', border: 'border-element-metals', text: 'text-element-metals' },
  'metalloid': { bg: 'bg-muted', border: 'border-element-metalloids', text: 'text-element-metalloids' },
  'nonmetal': { bg: 'bg-muted', border: 'border-element-nonmetals', text: 'text-element-nonmetals' },
  'halogen': { bg: 'bg-muted', border: 'border-element-halogens', text: 'text-element-halogens' },
  'noble-gas': { bg: 'bg-muted', border: 'border-element-noble-gases', text: 'text-element-noble-gases' },
  'lanthanide': { bg: 'bg-muted', border: 'border-element-lanthanides', text: 'text-element-lanthanides' },
  'actinide': { bg: 'bg-muted', border: 'border-element-actinides', text: 'text-element-actinides' },
  'unknown': { bg: 'bg-muted', border: 'border-border', text: 'text-foreground' },
}

export default function ElementModal({ element, onClose }: ElementModalProps) {
  const colors = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                <p className="text-muted-foreground capitalize">
                  {element.category.replace(/-/g, ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
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
            <p className="text-xs text-muted-foreground">
              ภาพด้านซ้ายคือการกระจายตัวของอิเล็กตรอน ส่วนด้านขวาเป็นตัวอย่างรูปพันธะ/โมเลกุลที่พบบ่อยของ{' '}
              {element.name} เพื่อช่วยจับคู่โครงสร้างกับสมบัติได้เร็วขึ้น
            </p>
          </div>

          {/* Basic Properties */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Basic Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground">Atomic Mass</div>
                <div className="text-xl font-bold text-foreground">
                  {element.atomicMass.toFixed(3)} u
                </div>
              </div>
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground">Group / Period</div>
                <div className="text-xl font-bold text-foreground">
                  {element.group || '—'} / {element.period}
                </div>
              </div>
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground">Block</div>
                <div className="text-xl font-bold text-foreground uppercase">{element.block}</div>
              </div>
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground">Standard State</div>
                <div className="text-xl font-bold text-foreground capitalize">
                  {element.standardState}
                </div>
              </div>
            </div>
          </div>

          {/* Electron Configuration */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Electron Configuration</h3>
            <div className="bg-muted border border-border rounded-lg p-4">
              <code className="text-base font-mono font-semibold text-primary-700">
                {element.electronConfiguration}
              </code>
            </div>
          </div>

          {/* Physical Properties */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Physical Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              {element.meltingPoint && (
                <div className="bg-muted border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Melting Point</div>
                  <div className="text-lg font-bold text-foreground">
                    {element.meltingPoint.toFixed(2)} K
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {(element.meltingPoint - 273.15).toFixed(2)} °C
                  </div>
                </div>
              )}
              {element.boilingPoint && (
                <div className="bg-muted border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Boiling Point</div>
                  <div className="text-lg font-bold text-foreground">
                    {element.boilingPoint.toFixed(2)} K
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {(element.boilingPoint - 273.15).toFixed(2)} °C
                  </div>
                </div>
              )}
              {element.density && (
                <div className="bg-muted border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Density</div>
                  <div className="text-lg font-bold text-foreground">
                    {element.density.toFixed(3)} g/cm³
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Atomic Properties */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Atomic Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              {element.electronegativity && (
                <div className="bg-muted border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Electronegativity</div>
                  <div className="text-lg font-bold text-foreground">
                    {element.electronegativity.toFixed(2)}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Pauling scale</div>
                </div>
              )}
              {element.ionizationEnergy && (
                <div className="bg-muted border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Ionization Energy</div>
                  <div className="text-lg font-bold text-foreground">
                    {element.ionizationEnergy.toFixed(2)} kJ/mol
                  </div>
                </div>
              )}
              {element.electronAffinity && (
                <div className="bg-muted border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-muted-foreground">Electron Affinity</div>
                  <div className="text-lg font-bold text-foreground">
                    {element.electronAffinity.toFixed(2)} kJ/mol
                  </div>
                </div>
              )}
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground">Oxidation States</div>
                <div className="text-lg font-bold text-foreground">
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
              <h3 className="text-lg font-bold text-foreground mb-3">Atomic Radii</h3>
              <div className="grid grid-cols-3 gap-4">
                {element.atomicRadius && (
                  <div className="bg-muted border border-border rounded-lg p-3">
                    <div className="text-sm font-medium text-muted-foreground">Atomic</div>
                    <div className="text-lg font-bold text-foreground">
                      {element.atomicRadius} pm
                    </div>
                  </div>
                )}
                {element.covalentRadius && (
                  <div className="bg-muted border border-border rounded-lg p-3">
                    <div className="text-sm font-medium text-muted-foreground">Covalent</div>
                    <div className="text-lg font-bold text-foreground">
                      {element.covalentRadius} pm
                    </div>
                  </div>
                )}
                {element.vanDerWaalsRadius && (
                  <div className="bg-muted border border-border rounded-lg p-3">
                    <div className="text-sm font-medium text-muted-foreground">Van der Waals</div>
                    <div className="text-lg font-bold text-foreground">
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
              <h3 className="text-lg font-bold text-foreground mb-3">Discovery</h3>
              <div className="bg-muted border border-border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  {element.discoveryYear && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Year</div>
                      <div className="text-lg font-bold text-foreground">
                        {element.discoveryYear}
                      </div>
                    </div>
                  )}
                  {element.discoverer && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Discoverer</div>
                      <div className="text-lg font-bold text-foreground">{element.discoverer}</div>
                    </div>
                  )}
                </div>
                {element.nameMeaning && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-sm font-medium text-muted-foreground">Name Meaning</div>
                    <div className="text-sm font-semibold text-foreground mt-1">
                      {element.nameMeaning}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-muted rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
