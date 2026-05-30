'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalcShell, Card, SectionTitle } from '@/components/lab';

const supportTiers = [
  {
    id: 'coffee',
    name: 'Coffee',
    amount: 3,
    description: 'Buy us a coffee to fuel late-night coding sessions',
    popular: false,
  },
  {
    id: 'lunch',
    name: 'Lunch',
    amount: 10,
    description: 'Help us power through with a proper meal',
    popular: true,
  },
  {
    id: 'feature',
    name: 'Feature Sponsor',
    amount: 25,
    description: 'Your name in our credits as a feature sponsor',
    popular: false,
  },
  {
    id: 'patron',
    name: 'Patron',
    amount: 50,
    description: 'Become a patron and shape our roadmap',
    popular: false,
  },
];

const recentSupporters = [
  { name: 'Anonymous Chemist', amount: 10, message: 'Great tool for my students!' },
  { name: 'Dr. Sarah', amount: 25, message: 'Love the NIST validation!' },
  { name: 'Chemistry Club MIT', amount: 50, message: 'Keep up the amazing work!' },
];

const milestones = [
  {
    target: 500,
    current: 127,
    title: '3D Orbital Visualizer',
    description: 'Interactive 3D electron orbital animations',
  },
  {
    target: 1000,
    current: 127,
    title: 'Mobile App',
    description: 'Native iOS & Android apps for chemistry on-the-go',
  },
  {
    target: 2500,
    current: 127,
    title: 'AI Chemistry Tutor Pro',
    description: 'Advanced AI tutoring with video explanations',
  },
];

export default function SupportPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSupport = (amount: number, tierId?: string) => {
    // Stripe Payment Links - PRODUCTION (from Stripe Dashboard 12 Dec 2025)
    const stripeLinks: Record<string, string> = {
      coffee: 'https://buy.stripe.com/9B6eVceFOg6z4Ctehm3cc0k',
      lunch: 'https://buy.stripe.com/aFaaEW69icUn8SJ6OU3cc0l',
      feature: 'https://buy.stripe.com/aFa00igNW3jNb0R1uA3cc0m',
      patron: 'https://buy.stripe.com/14A28q0OYaMfd8Z4GM3cc0n',
    };

    if (tierId && stripeLinks[tierId]) {
      window.open(stripeLinks[tierId], '_blank');
    } else {
      // For custom amounts, redirect to patron link as default
      window.open(stripeLinks.patron, '_blank');
    }
  };

  return (
    <CalcShell
      eyebrow="100% goes to development"
      title="Support VerChem"
      subtitle="VerChem is free for everyone. Your support helps us build new features, maintain servers, and keep chemistry education accessible. No pressure, no guilt — just gratitude."
      backHref="/"
      backLabel="Back to app"
      maxWidth="5xl"
    >
      {/* Impact Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground font-mono">10K+</div>
            <div className="text-sm text-muted-foreground">Students helped</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground font-mono">118</div>
            <div className="text-sm text-muted-foreground">Elements</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground font-mono">14</div>
            <div className="text-sm text-muted-foreground">Free tools</div>
          </div>
        </div>
      </Card>

      {/* Support Tiers */}
      <Card className="p-6">
        <SectionTitle className="mb-6 text-center">Choose your support level</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {supportTiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => {
                setSelectedTier(tier.id);
                setIsCustom(false);
              }}
              className={`relative p-6 rounded-md border text-left transition-colors
                ${selectedTier === tier.id
                  ? 'border-primary-500 bg-muted'
                  : 'border-border bg-card hover:bg-muted'
                }
              `}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-primary-foreground text-xs font-bold rounded-md">
                  Most popular
                </div>
              )}

              <h3 className="font-bold text-lg mb-1 text-foreground">{tier.name}</h3>
              <div className="text-3xl font-bold mb-2 text-foreground font-mono">
                ${tier.amount}
                <span className="text-sm font-normal text-muted-foreground ml-1">one-time</span>
              </div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>

              {selectedTier === tier.id && (
                <div className="absolute top-3 right-3">
                  <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="max-w-md mx-auto mb-8">
          <button
            onClick={() => {
              setIsCustom(true);
              setSelectedTier(null);
            }}
            className={`w-full p-4 rounded-md border transition-colors ${
              isCustom
                ? 'border-primary-500 bg-muted'
                : 'border-border hover:bg-muted'
            }`}
          >
            <div className="flex items-center justify-center gap-4">
              <span className="font-medium text-foreground">Custom amount</span>
              {isCustom && (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">$</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Any amount"
                    aria-label="Custom support amount in dollars"
                    className="input-premium w-32"
                  />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Support Button */}
        <div className="text-center">
          <button
            onClick={() => {
              const amount = isCustom
                ? parseInt(customAmount) || 0
                : supportTiers.find(t => t.id === selectedTier)?.amount || 0;
              if (amount > 0) {
                handleSupport(amount, isCustom ? undefined : selectedTier || undefined);
              }
            }}
            disabled={!selectedTier && (!isCustom || !customAmount)}
            className={`inline-flex items-center justify-center rounded-md font-bold text-lg px-12 py-4 min-h-[44px] transition-colors ${
              (selectedTier || (isCustom && customAmount))
                ? 'bg-primary-500 text-primary-foreground hover:bg-primary-600'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {selectedTier || (isCustom && customAmount)
              ? `Support with $${isCustom ? customAmount : supportTiers.find(t => t.id === selectedTier)?.amount}`
              : 'Select an amount'}
          </button>

          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure payment via Stripe
          </p>
        </div>
      </Card>

      {/* Funding Goals */}
      <Card className="p-6">
        <SectionTitle className="text-center mb-2">What we&apos;re building</SectionTitle>
        <p className="text-center text-muted-foreground mb-8">Your support directly funds these features</p>

        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const progress = Math.min((milestone.current / milestone.target) * 100, 100);
            return (
              <div key={index} className="p-5 rounded-md border border-border bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground">{milestone.title}</h3>
                  <span className="text-sm font-medium text-muted-foreground font-mono">
                    ${milestone.current} / ${milestone.target}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Supporters */}
      <Card className="p-6">
        <SectionTitle className="text-center mb-2">Recent supporters</SectionTitle>
        <p className="text-center text-muted-foreground mb-8">Thank you for believing in us</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentSupporters.map((supporter, index) => (
            <div key={index} className="p-5 rounded-md border border-border bg-muted">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md border border-border bg-card flex items-center justify-center text-foreground font-bold">
                  {supporter.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{supporter.name}</div>
                  <div className="text-sm text-primary-600 font-semibold font-mono">${supporter.amount}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">&ldquo;{supporter.message}&rdquo;</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/supporters"
            className="text-primary-600 hover:text-primary-500 font-medium inline-flex items-center gap-2"
          >
            View all supporters
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-6">
        <SectionTitle className="text-center mb-6">Questions?</SectionTitle>

        <div className="space-y-4">
          <div className="p-5 rounded-md border border-border bg-muted">
            <h3 className="font-bold mb-2 text-foreground">Is VerChem really free?</h3>
            <p className="text-muted-foreground">Yes! All core features are free forever. We believe chemistry education should be accessible to everyone. Support is completely optional.</p>
          </div>

          <div className="p-5 rounded-md border border-border bg-muted">
            <h3 className="font-bold mb-2 text-foreground">Where does my money go?</h3>
            <p className="text-muted-foreground">100% goes to development: servers, new features, data validation, and keeping the platform running. No fancy offices here!</p>
          </div>

          <div className="p-5 rounded-md border border-border bg-muted">
            <h3 className="font-bold mb-2 text-foreground">Do I get anything special?</h3>
            <p className="text-muted-foreground">All supporters get listed on our supporters page (if you want). $25+ sponsors get special recognition. But honestly, the best reward is knowing you helped thousands of students learn chemistry.</p>
          </div>

          <div className="p-5 rounded-md border border-border bg-muted">
            <h3 className="font-bold mb-2 text-foreground">Can I support monthly?</h3>
            <p className="text-muted-foreground">Not yet, but we&apos;re working on it! For now, one-time support works great. Come back anytime!</p>
          </div>
        </div>
      </Card>

      {/* Final CTA */}
      <Card className="p-10 text-center">
        <SectionTitle className="text-2xl mb-4">Every bit helps</SectionTitle>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Whether it&apos;s $3 or $50, your support means the world to us.
          Together, we&apos;re making chemistry education better for everyone.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center justify-center rounded-md bg-primary-500 px-8 py-3 min-h-[44px] font-bold text-primary-foreground hover:bg-primary-600 transition-colors"
        >
          Support VerChem
        </button>
      </Card>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Part of the <span className="text-primary-600 font-semibold">Ver* Ecosystem</span>
      </p>
    </CalcShell>
  );
}
