'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

const supportTiers = [
  {
    id: 'coffee',
    name: 'Coffee',
    emoji: '☕',
    amount: 3,
    description: 'Buy us a coffee to fuel late-night coding sessions',
    color: 'from-amber-400 to-orange-500',
    popular: false,
  },
  {
    id: 'lunch',
    name: 'Lunch',
    emoji: '🍕',
    amount: 10,
    description: 'Help us power through with a proper meal',
    color: 'from-orange-400 to-red-500',
    popular: true,
  },
  {
    id: 'feature',
    name: 'Feature Sponsor',
    emoji: '🚀',
    amount: 25,
    description: 'Your name in our credits as a feature sponsor',
    color: 'from-primary-400 to-secondary-500',
    popular: false,
  },
  {
    id: 'patron',
    name: 'Patron',
    emoji: '💎',
    amount: 50,
    description: 'Become a patron and shape our roadmap',
    color: 'from-secondary-400 to-pink-500',
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
    icon: '🔬'
  },
  {
    target: 1000,
    current: 127,
    title: 'Mobile App',
    description: 'Native iOS & Android apps for chemistry on-the-go',
    icon: '📱'
  },
  {
    target: 2500,
    current: 127,
    title: 'AI Chemistry Tutor Pro',
    description: 'Advanced AI tutoring with video explanations',
    icon: '🤖'
  },
];

export default function SupportPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSupport = (amount: number, tierId?: string) => {
    // Stripe Payment Links - PRODUCTION
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
            <Link href="/" className="text-secondary-600 hover:text-primary-600 transition-colors font-medium">
              Back to App
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full text-sm font-medium text-primary-700 dark:text-primary-300 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          100% goes to development
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-500 bg-clip-text text-transparent">
            Support VerChem
          </span>
        </h1>

        <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto mb-4 leading-relaxed">
          VerChem is <span className="font-semibold text-primary-600">free for everyone</span>.
          Your support helps us build new features, maintain servers, and keep chemistry education accessible.
        </p>

        <p className="text-muted-foreground mb-12">
          No pressure, no guilt. Just gratitude. 🙏
        </p>

        {/* Impact Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">10K+</div>
            <div className="text-sm text-muted-foreground">Students helped</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-600">118</div>
            <div className="text-sm text-muted-foreground">Elements</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600">14</div>
            <div className="text-sm text-muted-foreground">Free tools</div>
          </div>
        </div>
      </section>

      {/* Support Tiers */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Choose Your Support Level</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {supportTiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => {
                setSelectedTier(tier.id);
                setIsCustom(false);
              }}
              className={`relative p-6 rounded-2xl transition-all duration-300 text-left group
                ${selectedTier === tier.id
                  ? 'ring-2 ring-primary-500 shadow-lg scale-[1.02]'
                  : 'hover:shadow-md hover:scale-[1.01]'
                }
                bg-white dark:bg-neutral-800/50 border border-border
              `}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {tier.emoji}
              </div>

              <h3 className="font-bold text-lg mb-1">{tier.name}</h3>
              <div className="text-3xl font-bold mb-2">
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
            className={`w-full p-4 rounded-xl border transition-all ${
              isCustom
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-border hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl">🎁</span>
              <span className="font-medium">Custom Amount</span>
              {isCustom && (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Any amount"
                    className="w-24 px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-border focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
            className={`px-12 py-4 rounded-xl font-bold text-lg transition-all ${
              (selectedTier || (isCustom && customAmount))
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
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
      </section>

      {/* Funding Goals */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-border">
        <h2 className="text-2xl font-bold text-center mb-2">What We&apos;re Building</h2>
        <p className="text-center text-muted-foreground mb-12">Your support directly funds these features</p>

        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const progress = Math.min((milestone.current / milestone.target) * 100, 100);
            return (
              <div key={index} className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{milestone.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{milestone.title}</h3>
                      <span className="text-sm font-medium">
                        ${milestone.current} / ${milestone.target}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Supporters */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-border">
        <h2 className="text-2xl font-bold text-center mb-2">Recent Supporters</h2>
        <p className="text-center text-muted-foreground mb-12">Thank you for believing in us</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentSupporters.map((supporter, index) => (
            <div key={index} className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
                  {supporter.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{supporter.name}</div>
                  <div className="text-sm text-primary-600 font-semibold">${supporter.amount}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">&ldquo;{supporter.message}&rdquo;</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/supporters"
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
          >
            View all supporters
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16 border-t border-border">
        <h2 className="text-2xl font-bold text-center mb-12">Questions?</h2>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
            <h3 className="font-bold mb-2">Is VerChem really free?</h3>
            <p className="text-muted-foreground">Yes! All core features are free forever. We believe chemistry education should be accessible to everyone. Support is completely optional.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
            <h3 className="font-bold mb-2">Where does my money go?</h3>
            <p className="text-muted-foreground">100% goes to development: servers, new features, data validation, and keeping the platform running. No fancy offices here!</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
            <h3 className="font-bold mb-2">Do I get anything special?</h3>
            <p className="text-muted-foreground">All supporters get listed on our supporters page (if you want). $25+ sponsors get special recognition. But honestly, the best reward is knowing you helped thousands of students learn chemistry.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-border">
            <h3 className="font-bold mb-2">Can I support monthly?</h3>
            <p className="text-muted-foreground">Not yet, but we&apos;re working on it! For now, one-time support works great. Come back anytime!</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-pink-500/10 border border-primary-200 dark:border-primary-800">
          <h2 className="text-3xl font-bold mb-4">Every Bit Helps</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether it&apos;s $3 or $50, your support means the world to us.
            Together, we&apos;re making chemistry education better for everyone.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Support VerChem ♥
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 VerChem. Made with ♥ for chemistry lovers everywhere.</p>
          <p className="mt-2">
            Part of the <span className="text-primary-600 font-semibold">Ver* Ecosystem</span> by Job Prukpatarakul
          </p>
        </div>
      </footer>
    </div>
  );
}
