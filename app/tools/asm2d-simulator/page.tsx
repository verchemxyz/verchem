import type { Metadata } from 'next'
import Link from 'next/link'
import ASM2dSimulator from '@/components/wastewater/ASM2dSimulator'

export const metadata: Metadata = {
  title: 'ASM2d Biokinetic Simulator | Biological Phosphorus Removal | VerChem',
  description:
    'Free professional ASM2d (Activated Sludge Model No. 2d) simulator for biological phosphorus removal. Features 21 processes, 18 state variables, PAO/dPAO modeling, and A2O configuration. Competes with GPS-X ($15K) and BioWin ($5K).',
  keywords: [
    'ASM2d',
    'ASM2d simulator',
    'activated sludge model 2d',
    'biological phosphorus removal',
    'EBPR',
    'enhanced biological phosphorus removal',
    'PAO',
    'phosphorus accumulating organisms',
    'dPAO',
    'denitrifying PAO',
    'wastewater treatment',
    'A2O process',
    'nutrient removal',
    'biokinetic model',
    'IWA model',
  ],
  openGraph: {
    title: 'ASM2d Biokinetic Simulator - Biological Phosphorus Removal',
    description: 'Free IWA ASM2d activated sludge simulator with PAO/dPAO modeling for EBPR process design.',
    type: 'website',
  },
}

export default function ASM2dSimulatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <li>
              <Link href="/" className="hover:text-green-600">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/tools" className="hover:text-green-600">Tools</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/environmental" className="hover:text-green-600">Environmental</Link>
            </li>
            <li>/</li>
            <li className="text-green-600 font-medium">ASM2d Simulator</li>
          </ol>
        </nav>

        <ASM2dSimulator />

        {/* SEO Content */}
        <section className="mt-12 prose dark:prose-invert max-w-none">
          <h2>About the ASM2d Model</h2>
          <p>
            The <strong>Activated Sludge Model No. 2d (ASM2d)</strong> is an extension of the IWA ASM1 model,
            developed by Henze et al. (1999), specifically designed to model biological phosphorus removal
            with denitrifying Phosphorus Accumulating Organisms (dPAOs).
          </p>

          <h3>Key Differences from ASM1</h3>
          <ul>
            <li><strong>18 state variables</strong> (vs 13 in ASM1) including XPAO, XPHA, XPP, SPO4</li>
            <li><strong>21 biological processes</strong> (vs 8 in ASM1) covering all PAO mechanisms</li>
            <li><strong>Phosphorus dynamics</strong>: release under anaerobic, uptake under aerobic/anoxic</li>
            <li><strong>dPAO activity</strong>: PAOs that can use nitrate as electron acceptor</li>
            <li><strong>VFA/Acetate</strong>: Separate substrate for PAO PHA storage</li>
          </ul>

          <h3>EBPR (Enhanced Biological Phosphorus Removal)</h3>
          <p>
            ASM2d models the complete EBPR process where PAOs accumulate phosphorus beyond their growth
            requirements under cyclic anaerobic-aerobic (or anoxic) conditions:
          </p>
          <ol>
            <li><strong>Anaerobic zone</strong>: PAOs take up VFA and store as PHA, releasing ortho-P</li>
            <li><strong>Aerobic zone</strong>: PAOs use PHA for growth and energy, taking up excess P as poly-P</li>
            <li><strong>Anoxic zone (dPAO)</strong>: Similar to aerobic but using NO₃ as electron acceptor</li>
          </ol>

          <h3>Model Applications</h3>
          <ul>
            <li>A2O (Anaerobic-Anoxic-Oxic) process design</li>
            <li>Modified Bardenpho and UCT process simulation</li>
            <li>EBPR optimization and troubleshooting</li>
            <li>Nutrient removal research and education</li>
            <li>Process control strategy development</li>
          </ul>

          <h3>Why VerChem ASM2d?</h3>
          <p>
            VerChem provides a <strong>free, web-based ASM2d simulator</strong> that competes with
            commercial software like GPS-X ($15,000) and BioWin ($5,000). Our implementation includes:
          </p>
          <ul>
            <li>Complete 21-process kinetic model</li>
            <li>Multi-zone A2O reactor configuration</li>
            <li>PAO-specific parameter adjustment</li>
            <li>Real-time phosphorus balance tracking</li>
            <li>dPAO activity visualization</li>
            <li>Steady-state and dynamic simulation modes</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
