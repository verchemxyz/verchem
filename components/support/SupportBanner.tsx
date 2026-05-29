'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SupportBannerProps {
  /** Delay before showing (ms) */
  delay?: number;
  /** Position of the banner */
  position?: 'bottom' | 'inline';
  /** Variant style */
  variant?: 'subtle' | 'card';
}

/**
 * A subtle, non-intrusive support banner
 * - Shows after user has been on page for a while
 * - Can be dismissed (remembers for session)
 * - Respects user's choice
 */
export function SupportBanner({
  delay = 30000, // 30 seconds default
  position = 'bottom',
}: SupportBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check initial state synchronously during render
  const [initialDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = sessionStorage.getItem('verchem-support-dismissed');
    const supported = localStorage.getItem('verchem-supporter');
    return !!(dismissed || supported);
  });

  useEffect(() => {
    // Skip if already dismissed
    if (initialDismissed) {
      // Use setTimeout to defer setState
      const id = setTimeout(() => setIsDismissed(true), 0);
      return () => clearTimeout(id);
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, initialDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('verchem-support-dismissed', 'true');
  };

  const handleMaybeLater = () => {
    handleDismiss();
  };

  if (isDismissed || !isVisible) return null;

  if (position === 'bottom') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-slide-up">
        <div className="max-w-2xl mx-auto">
          <div className="relative p-4 sm:p-6 rounded-lg bg-card border border-border">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-foreground mb-1">Enjoying VerChem?</h3>
                <p className="text-sm text-muted-foreground">
                  VerChem is free forever. If it helps you, consider supporting our mission to make chemistry education accessible.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/support"
                  className="px-5 py-2 bg-primary-500 text-primary-foreground rounded-md font-medium text-sm hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  Support VerChem
                </Link>
                <button
                  onClick={handleMaybeLater}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (for embedding in pages)
  return (
    <div className="my-8 p-6 rounded-lg bg-card border border-border">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-semibold text-foreground mb-1">Support Free Chemistry Education</h3>
          <p className="text-sm text-muted-foreground">
            VerChem is free for everyone. Your support helps us add more features and keep servers running.
          </p>
        </div>
        <Link
          href="/support"
          className="px-5 py-2.5 bg-primary-500 text-primary-foreground rounded-md font-medium text-sm hover:bg-primary-600 transition-colors whitespace-nowrap"
        >
          Support Us
        </Link>
      </div>
    </div>
  );
}

/**
 * A minimal heart button that links to support
 * For use in footers or headers
 */
export function SupportHeartButton() {
  return (
    <Link
      href="/support"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium"
      title="Support VerChem"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span>Support</span>
    </Link>
  );
}

/**
 * A thank you message for after calculator use
 * Shows randomly (not every time)
 */
export function CalculatorThankYou() {
  // Initialize state lazily to avoid useEffect setState
  const [show] = useState(() => {
    if (typeof window === 'undefined') return false;

    // Only show 20% of the time
    const shouldShow = Math.random() < 0.2;
    if (!shouldShow) return false;

    // Check if shown recently
    const lastShown = localStorage.getItem('verchem-thankyou-shown');
    const hoursSinceShown = lastShown
      ? (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60)
      : 999;

    if (hoursSinceShown > 24) {
      localStorage.setItem('verchem-thankyou-shown', Date.now().toString());
      return true;
    }
    return false;
  });

  if (!show) return null;

  return (
    <div className="mt-4 p-4 rounded-lg bg-card border border-border text-center">
      <p className="text-sm text-muted-foreground mb-2">
        Glad we could help! VerChem is free thanks to our amazing supporters.
      </p>
      <Link
        href="/support"
        className="text-sm text-primary-500 hover:text-primary-600 font-medium"
      >
        Learn how you can help
      </Link>
    </div>
  );
}
