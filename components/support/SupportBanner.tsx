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
  variant = 'subtle',
}: SupportBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('verchem-support-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Check if user has already supported (from localStorage)
    const supported = localStorage.getItem('verchem-supporter');
    if (supported) {
      setIsDismissed(true);
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

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
          <div className="relative p-4 sm:p-6 rounded-2xl bg-white dark:bg-neutral-800 border border-border shadow-2xl">
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
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-3xl">
                ☕
              </div>

              {/* Content */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-lg mb-1">Enjoying VerChem?</h3>
                <p className="text-sm text-muted-foreground">
                  VerChem is free forever. If it helps you, consider supporting our mission to make chemistry education accessible.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/support"
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all whitespace-nowrap"
                >
                  Support VerChem ♥
                </Link>
                <button
                  onClick={handleMaybeLater}
                  className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
    <div className="my-8 p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-100 dark:border-primary-800">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="text-4xl">☕</div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-lg mb-1">Support Free Chemistry Education</h3>
          <p className="text-sm text-muted-foreground">
            VerChem is free for everyone. Your support helps us add more features and keep servers running.
          </p>
        </div>
        <Link
          href="/support"
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all whitespace-nowrap"
        >
          Support Us ♥
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors text-sm font-medium"
      title="Support VerChem"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
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
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show 20% of the time
    const shouldShow = Math.random() < 0.2;

    // Check if shown recently
    const lastShown = localStorage.getItem('verchem-thankyou-shown');
    const hoursSinceShown = lastShown
      ? (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60)
      : 999;

    if (shouldShow && hoursSinceShown > 24) {
      setShow(true);
      localStorage.setItem('verchem-thankyou-shown', Date.now().toString());
    }
  }, []);

  if (!show) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-100 dark:border-primary-800 text-center">
      <p className="text-sm text-muted-foreground mb-2">
        Glad we could help! VerChem is free thanks to our amazing supporters.
      </p>
      <Link
        href="/support"
        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        Learn how you can help →
      </Link>
    </div>
  );
}
