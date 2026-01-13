import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Environmental Engineering Tools | VerChem',
  description:
    'Professional environmental engineering tools: Wastewater Treatment Designer, Water Quality, Air Quality, Soil Quality calculators with Thai PCD standards compliance.',
  keywords: [
    'environmental engineering',
    'wastewater treatment',
    'water quality',
    'air quality',
    'soil quality',
    'Thai PCD standards',
    'BOD COD calculator',
    'treatment plant design',
  ],
}

// ============================================
// ENVIRONMENTAL TOOLS DATA
// ============================================

const ENVIRONMENTAL_TOOLS = [
  {
    href: '/tools/wastewater-treatment',
    icon: '🏭',
    label: 'Wastewater Treatment Designer',
    labelThai: 'ออกแบบระบบบำบัดน้ำเสีย',
    description: 'Design complete treatment trains with 15+ unit processes. Visual pipeline builder, cost estimation, sludge balance, energy analysis.',
    features: ['15 Unit Types', 'Visual Builder', 'Cost Estimation', 'Thai PCD'],
    gradient: 'from-blue-600 to-cyan-600',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-400',
    isHot: true,
  },
  {
    href: '/tools/water-quality',
    icon: '💧',
    label: 'Water Quality Calculator',
    labelThai: 'คำนวณคุณภาพน้ำ',
    description: 'BOD, COD, K-rate, efficiency calculations. 9 modes with Thai effluent standards compliance checker.',
    features: ['BOD/COD', '9 Modes', 'Thai Standards', 'Loading Rate'],
    gradient: 'from-teal-500 to-emerald-500',
    bgGradient: 'from-teal-50 to-emerald-50',
    borderColor: 'border-teal-400',
    isHot: false,
  },
  {
    href: '/tools/air-quality',
    icon: '🌬️',
    label: 'Air Quality Calculator',
    labelThai: 'คำนวณคุณภาพอากาศ',
    description: 'AQI calculation, unit conversion, Gaussian dispersion modeling. Thai PCD standards for PM2.5, PM10, O3, NO2, SO2, CO.',
    features: ['AQI', 'Dispersion Model', 'Thai PCD', '6 Pollutants'],
    gradient: 'from-green-500 to-lime-500',
    bgGradient: 'from-green-50 to-lime-50',
    borderColor: 'border-green-400',
    isHot: false,
  },
  {
    href: '/tools/soil-quality',
    icon: '🌱',
    label: 'Soil Quality Calculator',
    labelThai: 'คำนวณคุณภาพดิน',
    description: 'Heavy metal contamination, pH classification, NPK analysis, CEC, organic matter, texture, salinity assessment.',
    features: ['Heavy Metals', 'pH Class', 'NPK', 'Thai Standards'],
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-400',
    isHot: false,
  },
  {
    href: '/tools/asm1-simulator',
    icon: '🧬',
    label: 'ASM1 Biokinetic Simulator',
    labelThai: 'จำลอง ASM1',
    description: 'IWA Activated Sludge Model No. 1. Research-grade dynamic simulation with 8 biological processes and 13 state variables.',
    features: ['8 Processes', '13 Variables', 'Dynamic Sim', 'RK4 Solver'],
    gradient: 'from-purple-600 to-indigo-600',
    bgGradient: 'from-purple-50 to-indigo-50',
    borderColor: 'border-purple-400',
    isHot: true,
  },
] as const

// ============================================
// FEATURE HIGHLIGHTS
// ============================================

const HIGHLIGHTS = [
  {
    icon: '🇹🇭',
    title: 'Thai PCD Standards',
    description: 'Built-in compliance checking for Thai Pollution Control Department regulations. Type A/B/C effluent standards.',
  },
  {
    icon: '📊',
    title: 'Professional Reports',
    description: 'Export detailed PDF reports with calculations, graphs, and compliance status. Perfect for submissions.',
  },
  {
    icon: '💰',
    title: 'Cost Estimation',
    description: 'Capital and operating cost estimates for treatment systems. Make informed decisions.',
  },
  {
    icon: '🔬',
    title: 'Engineering Accuracy',
    description: 'Based on Metcalf & Eddy, ASCE, and EPA design guidelines. Validated calculations.',
  },
] as const

// ============================================
// COMPARISON TABLE
// ============================================

const COMPARISON = [
  { feature: 'Visual Treatment Train Builder', verchem: true, competitor: false },
  { feature: 'Thai PCD Standards Built-in', verchem: true, competitor: false },
  { feature: 'Cost Estimation', verchem: true, competitor: true },
  { feature: 'Sludge Mass Balance', verchem: true, competitor: true },
  { feature: 'Energy Analysis', verchem: true, competitor: true },
  { feature: 'ASM1 Biokinetic Model', verchem: true, competitor: true },
  { feature: 'Web-based (No Install)', verchem: true, competitor: false },
  { feature: 'Free Forever', verchem: true, competitor: false },
  { feature: 'Price', verchem: '$0', competitor: '$5,000-15,000' },
] as const

// ============================================
// MAIN COMPONENT
// ============================================

export default function EnvironmentalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-cyan-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-premium">VerChem</h1>
              <span className="text-xs text-emerald-600 font-medium">Environmental Engineering</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/tools" className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm">
              All Tools
            </Link>
            <Link href="/" className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm">
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              🌏 Environmental Engineering Suite
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Professional Tools
              </span>
              <br />
              <span className="text-foreground">for Environmental Engineers</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-secondary-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Design wastewater treatment systems, analyze water/air/soil quality with
              <span className="text-emerald-600 font-semibold"> Thai PCD standards</span> compliance.
              <br />
              <span className="text-lg">Free forever. No installation required.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tools/wastewater-treatment"
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg"
              >
                🏭 Start Designing
              </Link>
              <Link
                href="#tools"
                className="px-8 py-4 bg-white/80 backdrop-blur border-2 border-emerald-200 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-all text-lg"
              >
                Explore All Tools ↓
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur rounded-full">
                <span className="text-emerald-600">✓</span>
                <span className="font-medium">Thai PCD Certified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur rounded-full">
                <span className="text-emerald-600">✓</span>
                <span className="font-medium">100% Free</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur rounded-full">
                <span className="text-emerald-600">✓</span>
                <span className="font-medium">No Installation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4</div>
              <div className="text-emerald-100 font-medium">Pro Tools</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
              <div className="text-emerald-100 font-medium">Unit Processes</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">3</div>
              <div className="text-emerald-100 font-medium">Thai Standards</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">$0</div>
              <div className="text-emerald-100 font-medium">Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Environmental Engineering Tools
            </span>
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Professional-grade tools designed for environmental engineers, consultants, and students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ENVIRONMENTAL_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group relative rounded-2xl border-2 ${tool.borderColor} bg-gradient-to-br ${tool.bgGradient} p-6 hover:shadow-xl transition-all hover:scale-[1.02]`}
            >
              {tool.isHot && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full animate-bounce shadow-lg z-10">
                  🔥 FLAGSHIP
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${tool.gradient} rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                  {tool.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">
                    {tool.label}
                  </h3>
                  <p className="text-sm text-emerald-600 font-medium mb-2">{tool.labelThai}</p>
                  <p className="text-gray-600 text-sm mb-4">{tool.description}</p>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2">
                    {tool.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2.5 py-1 bg-white/70 text-gray-700 text-xs font-medium rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="absolute bottom-4 right-4 text-emerald-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Open Tool →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Highlights */}
      <section className="bg-gradient-to-br from-gray-50 to-emerald-50/50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose VerChem?</h2>
            <p className="text-secondary-600">Built specifically for Thai environmental engineering needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Compare with Commercial Software
          </h2>
          <p className="text-secondary-600">VerChem vs GPS-X, BioWin, and other $15,000+ solutions</p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold">
            <div className="p-4">Feature</div>
            <div className="p-4 text-center">VerChem</div>
            <div className="p-4 text-center">Commercial</div>
          </div>
          {COMPARISON.map((row, idx) => (
            <div key={row.feature} className={`grid grid-cols-3 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="p-4 text-gray-700">{row.feature}</div>
              <div className="p-4 text-center">
                {typeof row.verchem === 'boolean' ? (
                  row.verchem ? (
                    <span className="text-emerald-600 text-xl">✓</span>
                  ) : (
                    <span className="text-gray-400">✗</span>
                  )
                ) : (
                  <span className="font-bold text-emerald-600">{row.verchem}</span>
                )}
              </div>
              <div className="p-4 text-center">
                {typeof row.competitor === 'boolean' ? (
                  row.competitor ? (
                    <span className="text-emerald-600 text-xl">✓</span>
                  ) : (
                    <span className="text-gray-400">✗</span>
                  )
                ) : (
                  <span className="font-bold text-gray-600">{row.competitor}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Design Your Treatment System?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start designing with 15+ unit processes, cost estimation, and Thai PCD compliance checking.
          </p>
          <Link
            href="/tools/wastewater-treatment"
            className="inline-block px-10 py-4 bg-white text-emerald-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg"
          >
            🏭 Start Free Design
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/logo.png" alt="VerChem" fill className="object-contain" />
              </div>
              <span className="font-bold">VerChem</span>
              <span className="text-muted-foreground">| Environmental Engineering</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary-600">Home</Link>
              <Link href="/tools" className="hover:text-primary-600">All Tools</Link>
              <Link href="/calculators" className="hover:text-primary-600">Chemistry</Link>
              <Link href="/support" className="hover:text-primary-600">Support</Link>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>© 2025 VerChem. Part of the <span className="text-primary-600 font-semibold">Ver* Ecosystem</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
