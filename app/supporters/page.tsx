'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

// This would come from a database in production
const supporters = {
  patrons: [
    { name: 'Chemistry Club MIT', amount: 500, date: '2025-01', message: 'Supporting future chemists!' },
  ],
  sponsors: [
    { name: 'Dr. Sarah Chen', amount: 100, date: '2025-01', message: 'Amazing NIST validation!' },
    { name: 'Prof. Michael R.', amount: 75, date: '2025-01', message: 'Best chemistry tool for teaching' },
    { name: 'Lab Solutions Inc.', amount: 50, date: '2024-12' },
  ],
  supporters: [
    { name: 'Emma T.', amount: 25, date: '2025-01' },
    { name: 'James K.', amount: 25, date: '2025-01' },
    { name: 'Anonymous', amount: 25, date: '2024-12' },
    { name: 'Chemistry Student', amount: 10, date: '2025-01' },
    { name: 'Lisa M.', amount: 10, date: '2025-01' },
    { name: 'David P.', amount: 10, date: '2024-12' },
    { name: 'Anonymous', amount: 10, date: '2024-12' },
    { name: 'Coffee Lover', amount: 5, date: '2025-01' },
    { name: 'Student Helper', amount: 3, date: '2025-01' },
    { name: 'Anonymous', amount: 3, date: '2024-12' },
  ],
};

const totalRaised =
  supporters.patrons.reduce((sum, s) => sum + s.amount, 0) +
  supporters.sponsors.reduce((sum, s) => sum + s.amount, 0) +
  supporters.supporters.reduce((sum, s) => sum + s.amount, 0);

const totalSupporters =
  supporters.patrons.length +
  supporters.sponsors.length +
  supporters.supporters.length;

export default function SupportersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 transition-transform group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="VerChem Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/support" className="btn-premium text-sm">
              Support Us
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-500 bg-clip-text text-transparent">
            Our Amazing Supporters
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          These incredible people help keep VerChem free for everyone
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-8 max-w-md mx-auto mb-16">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              ${totalRaised}
            </div>
            <div className="text-muted-foreground">Total Raised</div>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
            <div className="text-4xl font-bold bg-gradient-to-r from-secondary-500 to-pink-500 bg-clip-text text-transparent">
              {totalSupporters}
            </div>
            <div className="text-muted-foreground">Supporters</div>
          </div>
        </div>
      </section>

      {/* Patrons - Top Tier */}
      {supporters.patrons.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">💎</span>
            <h2 className="text-2xl font-bold">Patrons</h2>
            <span className="text-sm text-muted-foreground">$50+</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supporters.patrons.map((supporter, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-gradient-to-br from-secondary-50 to-pink-50 dark:from-secondary-900/20 dark:to-pink-900/20 border-2 border-secondary-200 dark:border-secondary-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {supporter.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{supporter.name}</div>
                    <div className="text-secondary-600 dark:text-secondary-400 font-semibold">
                      ${supporter.amount}
                    </div>
                    {supporter.message && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        &ldquo;{supporter.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="text-3xl">🏆</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sponsors */}
      {supporters.sponsors.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🚀</span>
            <h2 className="text-2xl font-bold">Feature Sponsors</h2>
            <span className="text-sm text-muted-foreground">$25-$49</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supporters.sponsors.map((supporter, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-white dark:bg-neutral-800/50 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
                    {supporter.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold">{supporter.name}</div>
                    <div className="text-sm text-primary-600 font-semibold">${supporter.amount}</div>
                  </div>
                </div>
                {supporter.message && (
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    &ldquo;{supporter.message}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regular Supporters */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">❤️</span>
          <h2 className="text-2xl font-bold">Supporters</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {supporters.supporters.map((supporter, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-800/50 border border-border text-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-300 to-secondary-300 flex items-center justify-center text-white text-xs font-bold">
                {supporter.name.charAt(0)}
              </div>
              <span className="font-medium">{supporter.name}</span>
              <span className="text-primary-600 font-semibold">${supporter.amount}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center border-t border-border">
        <h2 className="text-2xl font-bold mb-4">Want to join this amazing group?</h2>
        <p className="text-muted-foreground mb-8">
          Every contribution helps keep chemistry education free and accessible.
        </p>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
        >
          <span>Become a Supporter</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 VerChem. Made with ♥ for chemistry lovers everywhere.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <Link href="/support" className="hover:text-primary-600">Support</Link>
            <Link href="/calculators" className="hover:text-primary-600">Calculators</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
