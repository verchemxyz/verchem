import Link from 'next/link'
import { CalcShell, Card, SectionTitle } from '@/components/lab'

export default function VirtualLabPage() {
  const labs = [
    {
      id: 'titration',
      name: 'Acid-Base Titration',
      description: 'Perform virtual titrations with real-time pH curves and color changes',
      difficulty: 'Beginner',
      time: '10-15 min',
      features: [
        'Real-time pH monitoring',
        'Multiple indicators',
        'Animated color changes',
        'Equivalence point detection',
      ],
      link: '/virtual-lab/titration',
    },
  ]

  return (
    <CalcShell
      eyebrow="Interactive · Virtual laboratory"
      title="Virtual Chemistry Laboratory"
      subtitle="Practice chemistry experiments safely online. No equipment needed, no chemicals wasted, unlimited attempts — built for students and educators."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      {/* Assurances */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {['100% Safe', 'No Equipment Needed', 'Unlimited Practice', 'Free Forever'].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Labs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <Link key={lab.id} href={lab.link} className="group block h-full">
            <Card className="p-6 h-full transition-colors hover:border-primary-500">
              {/* Badge */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">{lab.name}</h3>
                <span className="px-3 py-1 bg-success/10 text-success-strong rounded-full text-xs font-medium shrink-0">
                  Available
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-4 text-sm">{lab.description}</p>

              {/* Meta */}
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
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
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
              <div className="mt-6 pt-6 border-t border-border">
                <span className="text-primary-600 font-medium group-hover:gap-2 flex items-center gap-1 transition-all">
                  Start Lab
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Benefits Section */}
      <Card className="p-8">
        <SectionTitle className="mb-6 text-center text-2xl">Why virtual labs?</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-muted border border-border rounded-lg p-6">
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">Cost Effective</h3>
            <p className="text-muted-foreground text-sm">
              Save thousands on equipment and chemicals. Practice unlimited
              times without consumables.
            </p>
          </div>

          <div className="bg-muted border border-border rounded-lg p-6">
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">100% Safe</h3>
            <p className="text-muted-foreground text-sm">
              No risk of explosions, burns, or toxic exposure. Perfect for
              learning dangerous reactions safely.
            </p>
          </div>

          <div className="bg-muted border border-border rounded-lg p-6">
            <div className="w-12 h-12 bg-secondary-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-secondary-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">Better Learning</h3>
            <p className="text-muted-foreground text-sm">
              Visual animations and instant feedback help students understand
              concepts faster.
            </p>
          </div>
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-8 text-center">
        <SectionTitle className="mb-3 text-2xl">Ready to start experimenting?</SectionTitle>
        <p className="text-muted-foreground mb-6">
          Choose a lab above and start your virtual chemistry session.
        </p>
        <Link
          href="/virtual-lab/titration"
          className="inline-flex items-center justify-center rounded-md font-medium px-6 py-3 min-h-[44px] bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Start with Titration Lab
        </Link>
      </Card>
    </CalcShell>
  )
}
