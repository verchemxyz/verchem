import Link from 'next/link'

export default function VirtualLabPage() {
  const labs = [
    {
      id: 'titration',
      name: 'Acid-Base Titration',
      description: 'Perform virtual titrations with real-time pH curves and color changes',
      difficulty: 'Beginner',
      time: '10-15 min',
      icon: '🧪',
      gradient: 'from-blue-500 to-purple-600',
      features: [
        'Real-time pH monitoring',
        'Multiple indicators',
        'Animated color changes',
        'Equivalence point detection',
      ],
      status: 'available',
      link: '/virtual-lab/titration',
    },
    {
      id: 'reactions',
      name: 'Chemical Reactions',
      description: 'Mix chemicals and watch reactions happen in real-time',
      difficulty: 'Beginner',
      time: '5-10 min',
      icon: '💥',
      gradient: 'from-red-500 to-orange-600',
      features: [
        'Explosive reactions',
        'Precipitate formation',
        'Gas evolution',
        'Color changes',
      ],
      status: 'coming-soon',
      link: '#',
    },
    {
      id: 'gas-laws',
      name: 'Gas Laws Lab',
      description: 'Visualize molecular motion and see PV=nRT in action',
      difficulty: 'Intermediate',
      time: '10-15 min',
      icon: '💨',
      gradient: 'from-green-500 to-teal-600',
      features: [
        'Molecular motion animation',
        'Pressure/volume control',
        'Temperature effects',
        'Real-time graphing',
      ],
      status: 'coming-soon',
      link: '#',
    },
    {
      id: 'electrochemistry',
      name: 'Electrochemistry Lab',
      description: 'Build galvanic cells and see electron flow',
      difficulty: 'Advanced',
      time: '15-20 min',
      icon: '⚡',
      gradient: 'from-yellow-500 to-amber-600',
      features: [
        'Cell potential calculation',
        'Electron flow animation',
        'Electrode reactions',
        'Voltmeter display',
      ],
      status: 'coming-soon',
      link: '#',
    },
    {
      id: 'spectroscopy',
      name: 'Spectroscopy Lab',
      description: 'Analyze molecular structures using IR, UV-Vis, and NMR',
      difficulty: 'Advanced',
      time: '20-30 min',
      icon: '🌈',
      gradient: 'from-purple-500 to-pink-600',
      features: [
        'IR spectroscopy',
        'UV-Vis absorption',
        'NMR analysis',
        'Peak annotation',
      ],
      status: 'coming-soon',
      link: '#',
    },
  ]

  return (
    <div className="min-h-screen hero-gradient-premium">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center animate-float-premium shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-premium">VerChem</span>
              </h1>
              <p className="text-xs text-muted-foreground">Virtual Lab</p>
            </div>
          </Link>
          <Link href="/" className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Virtual Laboratory • Safe • Unlimited Practice
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Virtual Chemistry</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Laboratory
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Practice chemistry experiments safely online. No equipment needed,
            no chemicals wasted, unlimited attempts. Perfect for students and
            educators!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>100% Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No Equipment Needed</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Unlimited Practice</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Free Forever</span>
            </div>
          </div>
        </div>

        {/* Labs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {labs.map((lab) => (
            <div key={lab.id} className="relative">
              {lab.status === 'available' ? (
                <Link href={lab.link} className="group block">
                  <div className="premium-card p-6 hover:border-primary-500 hover:shadow-xl transition-all h-full border-2">
                    {/* Icon & Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${lab.gradient} rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}
                      >
                        {lab.icon}
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Available
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold mb-2">{lab.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm">{lab.description}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {lab.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        {lab.difficulty}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {lab.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <span className="text-blue-600 font-medium group-hover:gap-2 flex items-center gap-1 transition-all">
                        Start Lab
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="premium-card p-6 opacity-60 h-full border-2">
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${lab.gradient} rounded-xl flex items-center justify-center text-3xl opacity-50`}>
                      {lab.icon}
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Coming Soon
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold mb-2 text-gray-700">{lab.name}</h3>
                  <p className="text-gray-500 mb-4 text-sm">{lab.description}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {lab.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {lab.difficulty}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {lab.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="premium-card p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Why Virtual Labs?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Cost Effective</h3>
              <p className="text-gray-600 text-sm">
                Save thousands on equipment and chemicals. Practice unlimited
                times without consumables.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">100% Safe</h3>
              <p className="text-gray-600 text-sm">
                No risk of explosions, burns, or toxic exposure. Perfect for
                learning dangerous reactions safely.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Better Learning</h3>
              <p className="text-gray-600 text-sm">
                Visual animations and instant feedback help students understand
                concepts faster.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Experimenting?</h2>
          <p className="text-gray-600 mb-6">
            Choose a lab above and start your virtual chemistry journey!
          </p>
          <Link
            href="/virtual-lab/titration"
            className="btn-premium glow-premium inline-block px-8 py-4"
          >
            Start with Titration Lab
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem Virtual Lab • Built with ❤️ for safe chemistry experimentation</p>
          <p className="mt-2 text-xs">
            Practice safely, learn effectively, experiment unlimited
          </p>
        </div>
      </footer>
    </div>
  )
}
