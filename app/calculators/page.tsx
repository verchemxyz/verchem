'use client';

import Link from 'next/link';
import { CalcShell } from '@/components/lab';

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
    <CalcShell
      eyebrow="Calculators"
      title="Chemistry Calculators"
      subtitle="A hub for all VerChem calculators — from basic stoichiometry to advanced thermodynamics and electrochemistry."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CALCULATOR_LINKS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-lg border border-border bg-card hover:border-primary-500 transition-colors p-6 flex flex-col justify-between"
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
    </CalcShell>
  );
}
