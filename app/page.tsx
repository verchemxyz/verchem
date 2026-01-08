import Link from 'next/link'
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar'
import { SupportBanner } from '@/components/support/SupportBanner'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Hero Section - PREMIUM */}
      <section className="hero-gradient-premium max-w-7xl mx-auto px-4 py-24 text-center relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-400/20 rounded-full blur-3xl animate-pulse-premium"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary-400/20 rounded-full blur-3xl animate-pulse-premium" style={{animationDelay: '1s'}}></div>

        <div className="badge-premium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          🎁 100% Free • No Credit Card • World-Class Quality
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="text-premium">World-Class</span>
          <br />
          <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
            Chemistry Platform
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-secondary-600 max-w-3xl mx-auto mb-12 leading-relaxed">
          Professional calculators, interactive tools, and 118 elements validated against NIST standards.
          <br />
          <span className="text-primary-600 font-semibold">Built for students, educators & professionals.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/periodic-table" className="btn-premium glow-premium px-8 py-4 text-lg">
            🚀 Get Started Free
          </Link>
          <Link
            href="/periodic-table"
            className="px-8 py-4 premium-card rounded-xl font-semibold hover:shadow-lg transition-all text-lg inline-flex items-center justify-center gap-2"
          >
            <span>Explore Periodic Table</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 badge-premium">
            <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">NIST Validated</span>
          </div>
          <div className="flex items-center gap-2 badge-premium">
            <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold">100% Free</span>
          </div>
          <div className="flex items-center gap-2 badge-premium">
            <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span className="font-semibold">Open Source Spirit</span>
          </div>
        </div>

        {/* Global Search */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="premium-card p-2">
            <GlobalSearchBar
              placeholder="🔍 Search compounds, elements, calculators..."
              className="mb-0"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm">
            <Link
              href="/search?q=water"
              className="badge-premium hover:scale-105 transition-transform cursor-pointer"
            >
              water
            </Link>
            <Link
              href="/search?q=NaCl"
              className="badge-premium hover:scale-105 transition-transform cursor-pointer"
            >
              NaCl
            </Link>
            <Link
              href="/search?q=stoichiometry"
              className="badge-premium hover:scale-105 transition-transform cursor-pointer"
            >
              stoichiometry
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-float-premium">
              <div className="text-5xl font-bold mb-2">118</div>
              <div className="text-primary-100 font-medium">Complete Elements</div>
            </div>
            <div className="animate-float-premium" style={{animationDelay: '0.2s'}}>
              <div className="text-5xl font-bold mb-2">50+</div>
              <div className="text-primary-100 font-medium">Chemical Compounds</div>
            </div>
            <div className="animate-float-premium" style={{animationDelay: '0.4s'}}>
              <div className="text-5xl font-bold mb-2">15</div>
              <div className="text-primary-100 font-medium">Pro Tools</div>
            </div>
            <div className="animate-float-premium" style={{animationDelay: '0.6s'}}>
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-primary-100 font-medium">Free Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - PREMIUM CARDS */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-premium">Everything You Need</span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            15 professional tools validated against industry standards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 3D Molecular Viewer */}
          <Link href="/3d-viewer" className="group">
            <div className="premium-card p-6 h-full">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">3D Molecular Viewer</h3>
              <p className="text-muted-foreground mb-4">
                Interactive 3D visualization with CPK coloring and rotation controls
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-premium text-xs">Interactive</span>
                <span className="badge-premium text-xs">CPK Colors</span>
              </div>
            </div>
          </Link>

          {/* Molecule Builder - FEATURED */}
          <Link href="/molecule-builder" className="group relative">
            <div className="absolute -top-2 -right-2 bg-warning text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce z-10">
              🔥 HOT
            </div>
            <div className="premium-card p-6 h-full border-2 border-secondary-400/50">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-premium">
                Revolutionary Molecule Builder
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag-and-drop atoms with stability validation and shake animations
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-premium text-xs animate-pulse-premium">Drag & Drop</span>
                <span className="badge-premium text-xs">Stability AI</span>
                <span className="badge-premium text-xs">Animations</span>
              </div>
            </div>
          </Link>

          {/* Continue with more tools... (abbreviated for length) */}
          <Link href="/periodic-table" className="group">
            <div className="premium-card p-6 h-full">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Interactive Periodic Table</h3>
              <p className="text-muted-foreground mb-4">
                All 118 elements with complete NIST-validated data
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-premium text-xs">118 Elements</span>
                <span className="badge-premium text-xs">NIST Data</span>
              </div>
            </div>
          </Link>

          {/* Water Quality Calculator - NEW */}
          <Link href="/tools/water-quality" className="group relative">
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse z-10">
              🆕 NEW
            </div>
            <div className="premium-card p-6 h-full border-2 border-teal-400/50">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-teal-600 dark:text-teal-400">
                💧 Water Quality Calculator
              </h3>
              <p className="text-muted-foreground mb-4">
                BOD, COD, Thai effluent standards compliance with 9 calculation modes
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-premium text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">Environmental</span>
                <span className="badge-premium text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">Thai PCD</span>
                <span className="badge-premium text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">9 Modes</span>
              </div>
            </div>
          </Link>

          {/* Air Quality Calculator - NEW */}
          <Link href="/tools/air-quality" className="group relative">
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse z-10">
              🆕 NEW
            </div>
            <div className="premium-card p-6 h-full border-2 border-green-400/50">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-green-600 dark:text-green-400">
                🌬️ Air Quality Calculator
              </h3>
              <p className="text-muted-foreground mb-4">
                AQI, unit conversion, Thai PCD standards, Gaussian dispersion modeling
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-premium text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Environmental</span>
                <span className="badge-premium text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Thai PCD</span>
                <span className="badge-premium text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">6 Modes</span>
              </div>
            </div>
          </Link>

          {/* Soil Quality Calculator - NEW */}
          <Link href="/tools/soil-quality" className="group relative">
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse z-10">
              🆕 NEW
            </div>
            <div className="premium-card p-6 h-full border-2 border-amber-400/50">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-amber-600 dark:text-amber-400">
                🌱 Soil Quality Calculator
              </h3>
              <p className="text-muted-foreground mb-4">
                Heavy metals, pH, NPK, CEC, organic matter, texture, salinity analysis
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-premium text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Environmental</span>
                <span className="badge-premium text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Thai PCD</span>
                <span className="badge-premium text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">7 Modes</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12">
          <Link href="/calculators" className="btn-premium glow-premium">
            View All 17 Tools →
          </Link>
        </div>
      </section>

      <div className="divider-premium max-w-7xl mx-auto px-4"></div>

      {/* Free Forever + Support Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="badge-premium mb-4">🎁 100% Free</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-premium">Free Forever</span>
          </h2>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            All features are completely free. No credit card, no trial limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Forever */}
          <div className="premium-card p-8 relative border-2 border-primary-500 glow-premium">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
              🎁 FOREVER FREE
            </div>
            <div className="text-center mb-6 mt-2">
              <h3 className="text-2xl font-bold mb-2">Full Access</h3>
              <div className="text-5xl font-bold mb-2 text-primary-600">$0</div>
              <div className="text-muted-foreground">forever</div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>All 15 calculators & tools</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>118 elements (NIST data)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AI Chemistry Tutor</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Unlimited calculations</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Export to PDF, PNG, SVG</span>
              </li>
            </ul>
            <Link href="/calculators" className="w-full btn-premium block text-center">
              Start Using Free
            </Link>
          </div>

          {/* Support Us */}
          <div className="premium-card p-8 relative bg-gradient-to-br from-pink-50/50 to-red-50/50">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Support Us</h3>
              <div className="text-5xl mb-2">💚</div>
              <div className="text-muted-foreground">Help keep VerChem free</div>
            </div>
            <p className="text-muted-foreground mb-6 text-center">
              VerChem is built with love by a small team. Your support helps us maintain servers and develop new features.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <a href="https://buy.stripe.com/9B6eVceFOg6z4Ctehm3cc0k" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border-2 border-pink-300 text-pink-600 rounded-xl font-semibold hover:bg-pink-50 transition-all text-center">
                ☕ $3
              </a>
              <a href="https://buy.stripe.com/aFaaEW69icUn8SJ6OU3cc0l" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border-2 border-pink-300 text-pink-600 rounded-xl font-semibold hover:bg-pink-50 transition-all text-center">
                🍕 $10
              </a>
              <a href="https://buy.stripe.com/aFa00igNW3jNb0R1uA3cc0m" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border-2 border-pink-300 text-pink-600 rounded-xl font-semibold hover:bg-pink-50 transition-all text-center">
                🎁 $25
              </a>
              <a href="https://buy.stripe.com/14A28q0OYaMfd8Z4GM3cc0n" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border-2 border-pink-400 text-pink-700 rounded-xl font-semibold hover:bg-pink-50 transition-all text-center bg-pink-50">
                💎 $50
              </a>
            </div>
            <Link href="/support" className="w-full px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all block text-center">
              Learn More
            </Link>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            💚 Supported by donations from the chemistry community
          </p>
        </div>
      </section>

      <div className="divider-premium max-w-7xl mx-auto px-4"></div>

      {/* Why VerChem Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="badge-premium mb-4">✨ Why VerChem</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-premium">Built for Learning</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="premium-card p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">NIST Validated Data</h3>
            <p className="text-muted-foreground">
              All 118 elements with properties sourced from NIST and IUPAC standards. Accurate data you can trust.
            </p>
          </div>

          <div className="premium-card p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Step-by-Step Solutions</h3>
            <p className="text-muted-foreground">
              Every calculation shows the work. Learn the process, not just the answer. Perfect for students.
            </p>
          </div>

          <div className="premium-card p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Free Forever</h3>
            <p className="text-muted-foreground">
              No paywalls, no trials. Full access to all tools. Supported by donations from the community.
            </p>
          </div>
        </div>

        {/* Real Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">118</div>
            <div className="text-sm text-muted-foreground">Elements</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">14</div>
            <div className="text-sm text-muted-foreground">Pro Tools</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Compounds</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Free</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hero-gradient-premium max-w-7xl mx-auto px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-400/20 rounded-full blur-3xl animate-pulse-premium"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary-400/20 rounded-full blur-3xl animate-pulse-premium" style={{animationDelay: '1s'}}></div>

        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="text-premium">Ready to Transform</span>
          <br />
          <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
            Your Chemistry Experience?
          </span>
        </h2>
        <p className="text-xl text-secondary-600 mb-12 max-w-2xl mx-auto">
          All tools, all features, completely free. Start learning chemistry today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/calculators" className="btn-premium glow-premium px-10 py-4 text-lg">
            🚀 Get Started Free
          </Link>
          <Link
            href="/calculators"
            className="px-10 py-4 premium-card rounded-xl font-semibold hover:shadow-lg transition-all text-lg inline-flex items-center justify-center gap-2"
          >
            <span>Explore Tools</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">V</span>
                </div>
                <span className="font-bold text-lg">VerChem</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Free chemistry platform with NIST-validated data. Built for students and educators.
              </p>
              <div className="badge-premium">
                🎁 100% Free Forever
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/periodic-table" className="hover:text-primary-600">Periodic Table</Link></li>
                <li><Link href="/3d-viewer" className="hover:text-primary-600">3D Viewer</Link></li>
                <li><Link href="/molecule-builder" className="hover:text-primary-600">Molecule Builder</Link></li>
                <li><Link href="/calculators" className="hover:text-primary-600">All Calculators</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/support" className="hover:text-primary-600">Support Us ♥</Link></li>
                <li><Link href="/supporters" className="hover:text-primary-600">Our Supporters</Link></li>
                <li><Link href="/docs" className="hover:text-primary-600">Documentation</Link></li>
                <li><Link href="/contact" className="hover:text-primary-600">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary-600">Terms of Service</Link></li>
                <li><Link href="/refund" className="hover:text-primary-600">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="divider-premium"></div>

          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 VerChem. All rights reserved.</p>
            <p className="mt-2">Part of the <span className="text-primary-600 font-semibold">Ver* Ecosystem</span> by Job Prukpatarakul</p>
          </div>
        </div>
      </footer>

      {/* Support Banner - shows after 30 seconds */}
      <SupportBanner delay={30000} />
    </div>
  )
}
