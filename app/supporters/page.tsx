'use client';

import Link from 'next/link';
import { CalcShell, Card, SectionTitle } from '@/components/lab';

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
    <CalcShell
      eyebrow="Wall of gratitude"
      title="Our supporters"
      subtitle="These people help keep VerChem free for everyone."
      backHref="/"
      backLabel="Home"
      maxWidth="5xl"
      action={
        <Link
          href="/support"
          className="inline-flex items-center justify-center rounded-md bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          Support us
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-foreground font-mono">${totalRaised}</div>
          <div className="text-muted-foreground">Total raised</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold text-foreground font-mono">{totalSupporters}</div>
          <div className="text-muted-foreground">Supporters</div>
        </Card>
      </div>

      {/* Patrons - Top Tier */}
      {supporters.patrons.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <SectionTitle>Patrons</SectionTitle>
            <span className="text-sm text-muted-foreground font-mono">$50+</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supporters.patrons.map((supporter, index) => (
              <div
                key={index}
                className="p-6 rounded-md border border-primary-500 bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-md border border-border bg-card flex items-center justify-center text-foreground text-2xl font-bold">
                    {supporter.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-foreground">{supporter.name}</div>
                    <div className="text-primary-600 font-semibold font-mono">
                      ${supporter.amount}
                    </div>
                    {supporter.message && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        &ldquo;{supporter.message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sponsors */}
      {supporters.sponsors.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <SectionTitle>Feature sponsors</SectionTitle>
            <span className="text-sm text-muted-foreground font-mono">$25–$49</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supporters.sponsors.map((supporter, index) => (
              <div
                key={index}
                className="p-5 rounded-md border border-border bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md border border-border bg-card flex items-center justify-center text-foreground font-bold">
                    {supporter.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{supporter.name}</div>
                    <div className="text-sm text-primary-600 font-semibold font-mono">${supporter.amount}</div>
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
        </Card>
      )}

      {/* Regular Supporters */}
      <Card className="p-6">
        <SectionTitle className="mb-6">Supporters</SectionTitle>
        <div className="flex flex-wrap gap-3">
          {supporters.supporters.map((supporter, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted text-sm"
            >
              <div className="w-6 h-6 rounded-md border border-border bg-card flex items-center justify-center text-foreground text-xs font-bold">
                {supporter.name.charAt(0)}
              </div>
              <span className="font-medium text-foreground">{supporter.name}</span>
              <span className="text-primary-600 font-semibold font-mono">${supporter.amount}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-10 text-center">
        <SectionTitle className="mb-4">Want to join this group?</SectionTitle>
        <p className="text-muted-foreground mb-8">
          Every contribution helps keep chemistry education free and accessible.
        </p>
        <Link
          href="/support"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 px-8 py-4 min-h-[44px] font-bold text-primary-foreground hover:bg-primary-600 transition-colors"
        >
          <span>Become a supporter</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </Card>
    </CalcShell>
  );
}
