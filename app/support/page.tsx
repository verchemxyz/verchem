'use client';

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

// What support pays for. Deliberately no money raised / goal figures: there is
// no ledger behind them, and a progress bar nobody can audit is a claim we
// cannot back.
const fundingAreas = [
  {
    title: 'Reference data upkeep',
    description: 'Keeping 118 elements and 417 compounds aligned with current NIST/IUPAC editions.',
  },
  {
    title: 'Engine validation',
    description: 'Test vectors, independent cross-checks, and stating the assumptions behind every calculation.',
  },
  {
    title: 'Running costs',
    description: 'Hosting, storage, and the compute behind structure search and signed results.',
  },
];

export default function SupportPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Each tier maps to a fixed-price Stripe Payment Link. There is deliberately
  // no custom-amount path: the links are fixed-price, so any custom figure
  // would charge something other than what the button promised.
  const handleSupport = (tierId: string) => {
    // Stripe Payment Links - PRODUCTION (from Stripe Dashboard 12 Dec 2025)
    const stripeLinks: Record<string, string> = {
      coffee: 'https://buy.stripe.com/9B6eVceFOg6z4Ctehm3cc0k',
      lunch: 'https://buy.stripe.com/aFaaEW69icUn8SJ6OU3cc0l',
      feature: 'https://buy.stripe.com/aFa00igNW3jNb0R1uA3cc0m',
      patron: 'https://buy.stripe.com/14A28q0OYaMfd8Z4GM3cc0n',
    };

    const link = stripeLinks[tierId];
    if (link) window.open(link, '_blank');
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
            <div className="text-3xl font-bold text-foreground font-mono">118</div>
            <div className="text-sm text-muted-foreground">Elements (NIST/IUPAC)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground font-mono">417</div>
            <div className="text-sm text-muted-foreground">Compounds</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground font-mono">$0</div>
            <div className="text-sm text-muted-foreground">Cost to use</div>
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
              onClick={() => setSelectedTier(tier.id)}
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

        {/* Support Button */}
        <div className="text-center">
          <button
            onClick={() => {
              if (selectedTier) handleSupport(selectedTier);
            }}
            disabled={!selectedTier}
            className={`inline-flex items-center justify-center rounded-md font-bold text-lg px-12 py-4 min-h-[44px] transition-colors ${
              selectedTier
                ? 'bg-primary-500 text-primary-foreground hover:bg-primary-600'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {selectedTier
              ? `Support with $${supportTiers.find(t => t.id === selectedTier)?.amount}`
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

      {/* Where support goes */}
      <Card className="p-6">
        <SectionTitle className="text-center mb-2">Where support goes</SectionTitle>
        <p className="text-center text-muted-foreground mb-8">
          No fundraising totals here — we don&apos;t publish a figure we can&apos;t let you audit.
        </p>

        <div className="space-y-4">
          {fundingAreas.map((area) => (
            <div key={area.title} className="p-5 rounded-md border border-border bg-muted">
              <h3 className="font-bold text-foreground mb-1">{area.title}</h3>
              <p className="text-sm text-muted-foreground">{area.description}</p>
            </div>
          ))}
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
            <p className="text-muted-foreground">No — and that&apos;s deliberate. Every feature is already free for everyone, so support buys no tier, badge or unlock. It just keeps the work going.</p>
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
