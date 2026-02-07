'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAccessibility } from '@/lib/accessibility/context';
import { useAccessibilityFeatures } from '@/lib/accessibility/use-accessibility-features';
import { ARIA_LABELS } from '@/lib/accessibility/aria-labels';
import { AccessibilityMenu } from './accessibility-menu';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CommandPalette } from '@/components/search/CommandPalette';
import AuthButton from '@/components/AuthButton';
import { ThemeToggle } from '@/components/theme-toggle';
import { SupportHeartButton } from '@/components/support/SupportBanner';
import { UnitSystemToggle } from '@/components/units/UnitSelector';

interface NavigationItem {
  href: string;
  label: string;
  shortcut?: string;
  description: string;
  icon?: React.ReactNode;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    href: '/periodic-table',
    label: 'Periodic Table',
    shortcut: 'Alt+N',
    description: 'View periodic table of elements',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h12a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V10z" />
      </svg>
    )
  },
  {
    href: '/compounds',
    label: 'Compounds',
    description: 'Browse chemical compounds',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  {
    href: '/calculators',
    label: 'Calculators',
    shortcut: 'Alt+C',
    description: 'Access chemistry calculators',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: '/tools',
    label: 'Tools',
    description: 'Chemistry tools and utilities',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    href: '/support',
    label: 'Support',
    description: 'Support VerChem development',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  }
];

interface EnhancedNavigationProps {
  className?: string;
}

export function EnhancedNavigation({ className = '' }: EnhancedNavigationProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  const {
    announceToScreenReader,
    setShowShortcutsDialog: _setShowShortcutsDialog
  } = useAccessibility();
  
  const { addARIAAttributes, handleKeyboardNavigation } = useAccessibilityFeatures(navRef as React.RefObject<HTMLElement>, {
    context: 'navigation',
    announceOnMount: false
  });
  
  // Add ARIA attributes to navigation
  useEffect(() => {
    if (navRef.current) {
      addARIAAttributes({
        role: 'navigation',
        label: ARIA_LABELS.mainNavigation
      });
    }
  }, [addARIAAttributes]);
  
  // Handle keyboard navigation within the menu
  const handleNavKeyDown = (event: React.KeyboardEvent) => {
    handleKeyboardNavigation(event, {
      onEscape: () => setIsMenuOpen(false),
      preventDefault: true
    });
  };
  
  // Get current page label
  const getCurrentPageLabel = () => {
    const currentItem = NAVIGATION_ITEMS.find(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    return currentItem?.label || 'Unknown';
  };
  
  return (
    <nav 
      ref={navRef}
      className={`bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 ${className}`}
      onKeyDown={handleNavKeyDown}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1 transition-opacity"
              aria-label="VerChem Home"
            >
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="VerChem Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                VerChem
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${item.label} - ${item.description}`}
                  title={item.shortcut ? `${item.shortcut} - ${item.description}` : item.description}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            {/* Support Heart Button */}
            <div className="hidden sm:block">
              <SupportHeartButton />
            </div>

            {/* Quick Search Button */}
            <button
              onClick={() => {
                setShowCommandPalette(true);
                announceToScreenReader('Quick search opened');
              }}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Quick search (Ctrl+K)"
              title="Ctrl+K - Quick search"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* Auth Button */}
            <div className="hidden sm:block">
              <AuthButton />
            </div>

            {/* Unit System Toggle */}
            <div className="hidden sm:block">
              <UnitSystemToggle compact />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Accessibility Menu */}
            <AccessibilityMenu />

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                announceToScreenReader(`Navigation menu ${isMenuOpen ? 'closed' : 'opened'}`);
              }}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
              aria-controls="mobile-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4"
            role="menu"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-2">
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      setIsMenuOpen(false);
                      announceToScreenReader(`Navigated to ${item.label}`);
                    }}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded">
                      {item.shortcut}
                    </kbd>
                  </Link>
                );
              })}
            </div>
            
            {/* Current Page Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current page: <span className="font-medium text-gray-900 dark:text-gray-100">{getCurrentPageLabel()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Current Page Announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Current page: {getCurrentPageLabel()}
      </div>
      
      {/* Command Palette */}
      {showCommandPalette && (
        <CommandPalette 
          onClose={() => setShowCommandPalette(false)}
          onSearch={(query) => {
            window.open(`/search?q=${encodeURIComponent(query)}`, '_self');
          }}
        />
      )}
    </nav>
  );
}
