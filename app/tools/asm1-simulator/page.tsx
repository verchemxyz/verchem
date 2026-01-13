'use client'

import Link from 'next/link'
import Image from 'next/image'
import ASM1Simulator from '@/components/wastewater/ASM1Simulator'

export default function ASM1SimulatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/tools/wastewater-treatment"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              ← Treatment Designer
            </Link>
            <Link
              href="/environmental"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              Environmental Hub
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/tools" className="hover:text-primary-600">Tools</Link></li>
            <li>/</li>
            <li><Link href="/environmental" className="hover:text-primary-600">Environmental</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">ASM1 Simulator</li>
          </ol>
        </nav>

        {/* Main Content */}
        <ASM1Simulator />

        {/* Info Section */}
        <section className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">About ASM1 Model</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">What is ASM1?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The Activated Sludge Model No. 1 (ASM1) is the international standard for modeling
                biological wastewater treatment processes. Developed by the IWA Task Group in 1987,
                it describes the removal of organic carbon compounds and nitrogen.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                ASM1 includes <strong>8 biological processes</strong> and tracks <strong>13 state variables</strong>,
                making it suitable for design and optimization of activated sludge systems.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Key Features</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>COD-based kinetic modeling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Nitrification and denitrification processes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Hydrolysis of slowly biodegradable substrate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Decay and lysis of biomass</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Temperature correction (Arrhenius)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>4th order Runge-Kutta solver</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Process Table */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">ASM1 Biological Processes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-left">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Process</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { n: 1, name: 'Aerobic Growth of Heterotrophs', desc: 'Oxidation of readily biodegradable substrate' },
                    { n: 2, name: 'Anoxic Growth of Heterotrophs', desc: 'Denitrification using nitrate as electron acceptor' },
                    { n: 3, name: 'Aerobic Growth of Autotrophs', desc: 'Nitrification of ammonia to nitrate' },
                    { n: 4, name: 'Decay of Heterotrophs', desc: 'Death and lysis of heterotrophic biomass' },
                    { n: 5, name: 'Decay of Autotrophs', desc: 'Death and lysis of autotrophic biomass' },
                    { n: 6, name: 'Ammonification', desc: 'Conversion of soluble organic N to ammonia' },
                    { n: 7, name: 'Hydrolysis of Organics', desc: 'Breakdown of slowly biodegradable substrate' },
                    { n: 8, name: 'Hydrolysis of Organic N', desc: 'Release of organic N from particulates' },
                  ].map(p => (
                    <tr key={p.n} className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-600">{p.n}</td>
                      <td className="py-2 px-3 font-medium">{p.name}</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* References */}
          <div className="mt-8 pt-6 border-t dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-2">References</h3>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>
                Henze, M., Grady Jr, C.P.L., Gujer, W., Marais, G.V.R., Matsuo, T. (1987).
                Activated Sludge Model No. 1. IAWPRC Scientific and Technical Report No. 1.
              </li>
              <li>
                Metcalf & Eddy (2014). Wastewater Engineering: Treatment and Resource Recovery (5th ed.).
                McGraw-Hill Education.
              </li>
            </ul>
          </div>
        </section>

        {/* Related Tools */}
        <section className="mt-8 grid md:grid-cols-3 gap-4">
          <Link
            href="/tools/wastewater-treatment"
            className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-2">🏭</div>
            <h3 className="font-semibold">Treatment Designer</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visual treatment train builder with 15+ unit types
            </p>
          </Link>
          <Link
            href="/tools/water-quality"
            className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-2">💧</div>
            <h3 className="font-semibold">Water Quality</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              BOD/COD calculations with Thai PCD standards
            </p>
          </Link>
          <Link
            href="/environmental"
            className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-2">🌍</div>
            <h3 className="font-semibold">Environmental Hub</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All environmental engineering tools
            </p>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>ASM1 Model Implementation © VerChem 2025-2026</p>
          <p className="mt-1">
            Free forever • Research-grade quality • Thai PCD compliance
          </p>
        </div>
      </footer>
    </div>
  )
}
