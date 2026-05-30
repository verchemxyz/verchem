 'use client'

// VerChem - Electrochemistry Calculator Page

import { useState } from 'react'
import Link from 'next/link'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  Field,
} from '@/components/lab'
import {
  calculateCellPotential,
  calculateNernstEquation,
  calculateElectrolysis,
  getAllHalfReactions,
  EXAMPLE_CELLS,
  type NernstResult,
  type ElectrolysisResult,
} from '@/lib/calculations/electrochemistry'
import { FARADAY_CONSTANT } from '@/lib/constants/physical-constants'

export default function ElectrochemistryPage() {
  // Cell Potential Calculator
  const [cathodePotential, setCathodePotential] = useState(0.34)
  const [anodePotential, setAnodePotential] = useState(-0.76)
  const [cellElectrons, setCellElectrons] = useState(2)
  const [cellResult, setCellResult] = useState<ReturnType<
    typeof calculateCellPotential
  > | null>(null)

  // Nernst Equation Calculator
  const [nernstE0, setNernstE0] = useState(1.1)
  const [nernstN, setNernstN] = useState(2)
  const [nernstQ, setNernstQ] = useState(0.1)
  const [nernstTemp, setNernstTemp] = useState(298.15)
  const [nernstResult, setNernstResult] = useState<NernstResult | null>(null)

  // Electrolysis Calculator
  const [current, setCurrent] = useState(10)
  const [time, setTime] = useState(3600)
  const [electronsPerMole, setElectronsPerMole] = useState(2)
  const [molarMass, setMolarMass] = useState(63.55)
  const [isGas, setIsGas] = useState(false)
  const [electrolysisResult, setElectrolysisResult] =
    useState<ElectrolysisResult | null>(null)

  const [activeTab, setActiveTab] = useState<
    'cell-potential' | 'nernst' | 'electrolysis' | 'potentials'
  >('cell-potential')

  const handleCalculateCellPotential = () => {
    const result = calculateCellPotential(
      cathodePotential,
      anodePotential,
      Math.max(1, cellElectrons)
    )
    setCellResult(result)
  }

  const handleCalculateNernst = () => {
    const result = calculateNernstEquation(nernstE0, nernstN, nernstQ, nernstTemp)
    setNernstResult(result)
  }

  const handleCalculateElectrolysis = () => {
    const result = calculateElectrolysis(
      current,
      time,
      electronsPerMole,
      molarMass,
      isGas
    )
    setElectrolysisResult(result)
  }

  const halfReactions = getAllHalfReactions()

  return (
    <CalcShell
      eyebrow="Physical chemistry · redox · Nernst"
      title="Electrochemistry"
      subtitle="Cell potential, Nernst equation, and electrolysis calculations."
      backHref="/"
      backLabel="Home"
      maxWidth="6xl"
      action={
        <Link
          href="/electrochemistry/enhanced-page"
          className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          Enhanced (uncertainty)
        </Link>
      }
    >
      {/* Tabs */}
      <Card className="p-0">
        <div className="flex flex-wrap border-b border-border">
          <button
            onClick={() => setActiveTab('cell-potential')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'cell-potential'
                ? 'border-b-2 border-primary-500 text-primary-600 bg-muted'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Cell Potential
          </button>
          <button
            onClick={() => setActiveTab('nernst')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'nernst'
                ? 'border-b-2 border-primary-500 text-primary-600 bg-muted'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Nernst Equation
          </button>
          <button
            onClick={() => setActiveTab('electrolysis')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'electrolysis'
                ? 'border-b-2 border-primary-500 text-primary-600 bg-muted'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Electrolysis
          </button>
          <button
            onClick={() => setActiveTab('potentials')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'potentials'
                ? 'border-b-2 border-primary-500 text-primary-600 bg-muted'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Standard Potentials
          </button>
        </div>

          {/* Cell Potential Calculator */}
          {activeTab === 'cell-potential' && (
            <div className="p-6">
              <SectionTitle className="mb-4">Cell Potential Calculator</SectionTitle>
              <p className="text-sm text-muted-foreground mb-6">
                Calculate E°cell = E°cathode - E°anode
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Field label="Cathode E° (V)">
                  <input
                    type="number"
                    step="0.01"
                    value={cathodePotential}
                    onChange={(e) => setCathodePotential(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Anode E° (V)">
                  <input
                    type="number"
                    step="0.01"
                    value={anodePotential}
                    onChange={(e) => setAnodePotential(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="อิเล็กตรอนถ่ายโอน (n)">
                  <input
                    type="number"
                    min="1"
                    value={cellElectrons}
                    onChange={(e) =>
                      setCellElectrons(
                        Number.isNaN(parseInt(e.target.value))
                          ? 1
                          : parseInt(e.target.value)
                      )
                    }
                    className="input-premium w-full"
                  />
                </Field>
              </div>

              <Button onClick={handleCalculateCellPotential} className="w-full">
                Calculate
              </Button>

              {cellResult && (
                <div className="mt-6 bg-muted border border-border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">E°cell:</span>
                      <p className="text-2xl font-bold font-mono text-foreground">
                        {cellResult.cellPotential.toFixed(3)} V
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Spontaneous:</span>
                      <p
                        className={`text-2xl font-bold ${
                          cellResult.spontaneous ? 'text-success-strong' : 'text-destructive-strong'
                        }`}
                      >
                        {cellResult.spontaneous ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">ΔG°:</span>
                      <p className="text-2xl font-bold font-mono text-foreground">
                        {(cellResult.deltaG / 1000).toFixed(2)} kJ/mol
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ΔG° = -nF E° โดย n = {cellResult.electrons}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Example Cells */}
              <div className="mt-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Example cells</h3>
                <div className="space-y-2">
                  {EXAMPLE_CELLS.map((cell, i) => (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-md p-3 hover:bg-muted hover:border-primary-500/40 cursor-pointer transition-colors"
                      onClick={() => {
                        setCathodePotential(cell.cathodeE0)
                        setAnodePotential(cell.anodeE0)
                      }}
                    >
                      <div className="font-semibold text-foreground">{cell.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {cell.description}
                      </div>
                      <div className="text-xs font-mono mt-1 text-muted-foreground">
                        E°cell = {cell.cellE0} V
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nernst Equation Calculator */}
          {activeTab === 'nernst' && (
            <div className="p-6">
              <SectionTitle className="mb-4">Nernst Equation Calculator</SectionTitle>
              <p className="text-sm text-muted-foreground mb-6">
                E = E° - (RT/nF)ln(Q) or E = E° - (0.0592/n)log₁₀(Q) at 25°C
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Field label="E° (V)">
                  <input
                    type="number"
                    step="0.01"
                    value={nernstE0}
                    onChange={(e) => setNernstE0(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Electrons Transferred (n)">
                  <input
                    type="number"
                    value={nernstN}
                    onChange={(e) => setNernstN(parseInt(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Reaction Quotient (Q)">
                  <input
                    type="number"
                    step="0.01"
                    value={nernstQ}
                    onChange={(e) => setNernstQ(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Temperature (K)">
                  <input
                    type="number"
                    step="0.1"
                    value={nernstTemp}
                    onChange={(e) => setNernstTemp(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>
              </div>

              <Button onClick={handleCalculateNernst} className="w-full">
                Calculate
              </Button>

              {nernstResult && (
                <div className="mt-6">
                  <div className="bg-muted border-l-2 border-l-primary-500 rounded-md p-4 mb-4">
                    <span className="text-sm text-primary-600">Cell Potential (E):</span>
                    <p className="text-3xl font-bold font-mono text-foreground">
                      {nernstResult.E.toFixed(4)} V
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-md p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Steps:</h3>
                    <ol className="space-y-1 text-sm text-muted-foreground font-mono">
                      {nernstResult.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Electrolysis Calculator */}
          {activeTab === 'electrolysis' && (
            <div className="p-6">
              <SectionTitle className="mb-4">Electrolysis Calculator</SectionTitle>
              <p className="text-sm text-muted-foreground mb-6">
                Calculate mass, moles, and volume from current and time
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Field label="Current (A)">
                  <input
                    type="number"
                    step="0.1"
                    value={current}
                    onChange={(e) => setCurrent(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Time (seconds)">
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Electrons per Mole (n)">
                  <input
                    type="number"
                    value={electronsPerMole}
                    onChange={(e) => setElectronsPerMole(parseInt(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Molar Mass (g/mol)">
                  <input
                    type="number"
                    step="0.01"
                    value={molarMass}
                    onChange={(e) => setMolarMass(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </Field>
              </div>

              <label className="flex items-center space-x-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGas}
                  onChange={(e) => setIsGas(e.target.checked)}
                  className="w-4 h-4 accent-primary-500 border-border rounded"
                />
                <span className="text-sm text-foreground">Calculate volume (for gases)</span>
              </label>

              <Button onClick={handleCalculateElectrolysis} className="w-full">
                Calculate
              </Button>

              {electrolysisResult && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-muted border border-border rounded-md p-4">
                      <span className="text-sm text-muted-foreground">Charge:</span>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {electrolysisResult.charge.toFixed(2)} C
                      </p>
                    </div>
                    <div className="bg-muted border border-border rounded-md p-4">
                      <span className="text-sm text-muted-foreground">Moles:</span>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {electrolysisResult.moles.toFixed(6)} mol
                      </p>
                    </div>
                    <div className="bg-muted border border-border rounded-md p-4">
                      <span className="text-sm text-muted-foreground">Mass:</span>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {electrolysisResult.mass.toFixed(4)} g
                      </p>
                    </div>
                    {electrolysisResult.volume && (
                      <div className="bg-muted border border-border rounded-md p-4">
                        <span className="text-sm text-muted-foreground">Volume (STP):</span>
                        <p className="text-xl font-bold font-mono text-foreground">
                          {electrolysisResult.volume.toFixed(4)} L
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-md p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Steps:</h3>
                    <ol className="space-y-1 text-sm text-muted-foreground font-mono">
                      {electrolysisResult.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              <div className="mt-6 bg-muted border border-border rounded-md p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Faraday&apos;s Constant
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  F = {FARADAY_CONSTANT.toLocaleString()} C/mol
                </p>
              </div>
            </div>
          )}

          {/* Standard Potentials Table */}
          {activeTab === 'potentials' && (
            <div className="p-6">
              <SectionTitle className="mb-4">
                Standard Reduction Potentials
              </SectionTitle>
              <p className="text-sm text-muted-foreground mb-6">
                E° values at 25°C, 1 M concentration, 1 atm pressure
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-foreground">Half-Reaction</th>
                      <th className="px-4 py-2 text-right text-foreground">E° (V)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {halfReactions.map((hr, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted">
                        <td className="px-4 py-2 font-mono text-xs text-foreground">
                          {hr.reaction}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono font-bold ${
                            hr.E0 > 0 ? 'text-success-strong' : 'text-destructive-strong'
                          }`}
                        >
                          {hr.E0 > 0 ? '+' : ''}
                          {hr.E0.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 bg-muted border border-border rounded-md p-4">
                <h3 className="text-sm font-semibold mb-2 text-foreground">
                  Legend
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center">
                    <span className="text-success-strong font-bold mr-2">+</span>
                    Positive E°: Strong oxidizing agent (easily reduced)
                  </li>
                  <li className="flex items-center">
                    <span className="text-destructive-strong font-bold mr-2">-</span>
                    Negative E°: Strong reducing agent (easily oxidized)
                  </li>
                </ul>
              </div>
            </div>
          )}
      </Card>
    </CalcShell>
  )
}
