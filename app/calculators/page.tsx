'use client';

import Link from 'next/link';

const CALCULATOR_LINKS = [
  { href: '/stoichiometry', label: 'Stoichiometry', description: 'Moles, limiting reagent, theoretical yield' },
  { href: '/equation-balancer', label: 'Equation Balancer', description: 'Balance chemical equations automatically' },
  { href: '/solutions', label: 'Solutions & pH', description: 'pH, buffers, and solution properties' },
  { href: '/gas-laws', label: 'Gas Laws', description: 'Ideal gas law and related calculations' },
  { href: '/thermodynamics', label: 'Thermodynamics', description: 'Enthalpy, entropy, and Gibbs free energy' },
  { href: '/kinetics', label: 'Kinetics', description: 'Reaction rates and kinetics' },
  { href: '/electrochemistry', label: 'Electrochemistry', description: 'Cell potentials and electrochemical cells' },
  { href: '/electron-config', label: 'Electron Configuration', description: 'Electron configurations and orbitals' },
  { href: '/lewis', label: 'Lewis Structures', description: 'Lewis structure builder and checker' },
  { href: '/vsepr', label: 'VSEPR Geometry', description: 'Molecular shapes and bond angles' },
];

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-text-inverse font-bold text-xl">V</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-primary-600">Ver</span>
              <span className="text-foreground">Chem</span>
            </h1>
          </Link>
          <Link href="/" className="text-secondary-600 hover:text-primary-600 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <section className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-3 text-foreground">
            Chemistry Calculators
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            A hub for all VerChem calculators — from basic stoichiometry to advanced thermodynamics and electrochemistry.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CALCULATOR_LINKS.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border-2 border-border bg-card hover:border-primary-500 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-primary-600">
                  {tool.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Open calculator →
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}

