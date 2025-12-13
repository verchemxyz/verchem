'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Calculator, Beaker, Book, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Import element data
import { PERIODIC_TABLE } from '@/lib/data/periodic-table';
import { COMMON_COMPOUNDS } from '@/lib/data/compounds';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'calculator' | 'element' | 'compound' | 'help';
  url: string;
  icon?: React.ReactNode;
}

const CALCULATORS: SearchResult[] = [
  {
    id: 'equation-balancer',
    title: 'Equation Balancer',
    description: 'Balance chemical equations automatically',
    category: 'calculator',
    url: '/equation-balancer',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'stoichiometry',
    title: 'Stoichiometry Calculator',
    description: 'Molecular mass, mole conversions, limiting reagent',
    category: 'calculator',
    url: '/stoichiometry',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'solutions',
    title: 'Solutions & pH Calculator',
    description: 'Molarity, pH, buffer calculations',
    category: 'calculator',
    url: '/solutions',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'gas-laws',
    title: 'Gas Laws Calculator',
    description: 'Ideal gas, Boyle\'s, Charles\'s, Van der Waals',
    category: 'calculator',
    url: '/gas-laws',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'thermodynamics',
    title: 'Thermodynamics Calculator',
    description: 'ΔH, ΔS, ΔG, equilibrium calculations',
    category: 'calculator',
    url: '/thermodynamics',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'kinetics',
    title: 'Chemical Kinetics Calculator',
    description: 'Rate laws, half-life, Arrhenius equation',
    category: 'calculator',
    url: '/kinetics',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'electrochemistry',
    title: 'Electrochemistry Calculator',
    description: 'Redox, galvanic cells, Nernst equation',
    category: 'calculator',
    url: '/electrochemistry',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'electron-config',
    title: 'Electron Configuration',
    description: 'Orbital diagrams and electron notation',
    category: 'calculator',
    url: '/electron-config',
    icon: <Calculator className="w-5 h-5" />,
  },
];

/**
 * Global Search Component
 *
 * Features:
 * - Search across calculators, elements, compounds
 * - Keyboard shortcut (Cmd/Ctrl + K)
 * - Recent searches (mock for now)
 * - Trending searches (mock for now)
 * - Fuzzy search
 *
 * @example
 * <GlobalSearch />
 */
export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches] = useState(['H2O', 'pH calculator', 'Gold']);

  // ACCESSIBILITY: Focus trap refs (Dec 2025 - 4-AI Audit)
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search calculators
    CALCULATORS.forEach(calc => {
      if (
        calc.title.toLowerCase().includes(searchTerm) ||
        calc.description.toLowerCase().includes(searchTerm)
      ) {
        allResults.push(calc);
      }
    });

    // Search elements
    PERIODIC_TABLE.forEach(element => {
      const matches =
        element.name.toLowerCase().includes(searchTerm) ||
        element.symbol.toLowerCase().includes(searchTerm) ||
        element.atomicNumber.toString() === searchTerm;

      if (matches) {
        allResults.push({
          id: `element-${element.atomicNumber}`,
          title: `${element.name} (${element.symbol})`,
          description: `Atomic number: ${element.atomicNumber}, Category: ${element.category}`,
          category: 'element',
          url: `/periodic-table?element=${element.symbol}`,
          icon: <Beaker className="w-5 h-5" />,
        });
      }
    });

    // Search compounds
    COMMON_COMPOUNDS.forEach(compound => {
      const matches =
        compound.name.toLowerCase().includes(searchTerm) ||
        compound.formula.toLowerCase().includes(searchTerm) ||
        compound.uses?.some(use => use.toLowerCase().includes(searchTerm));

      if (matches) {
        allResults.push({
          id: `compound-${compound.formula}`,
          title: `${compound.name} (${compound.formula})`,
          description: compound.uses?.[0] || 'Chemical compound',
          category: 'compound',
          url: `/compounds?formula=${compound.formula}`,
          icon: <Book className="w-5 h-5" />,
        });
      }
    });

    return allResults.slice(0, 10); // Limit to 10 results
  }, [query]);

  // Close handler
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K) + Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // ACCESSIBILITY: Focus management (Dec 2025 - 4-AI Audit)
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus the input when modal opens
      setTimeout(() => inputRef.current?.focus(), 0);

      // Trap focus inside modal
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  const handleResultClick = (url: string) => {
    router.push(url);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Search...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search modal - ACCESSIBILITY: role="dialog" + aria attributes */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
            className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <label id="search-modal-title" className="sr-only">
                Search calculators, elements, and compounds
              </label>
              <div className="flex items-center gap-3">
                <Search className="w-6 h-6 text-gray-400" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search calculators, elements, compounds..."
                  className="flex-1 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  aria-labelledby="search-modal-title"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.trim() === '' ? (
                /* Recent searches */
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Recent Searches
                    </span>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(search)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {search}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-6 mb-3">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Trending
                    </span>
                  </div>
                  <div className="space-y-2">
                    {['pH calculator', 'Water', 'Equation balancer'].map((trend, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(trend)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {trend}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                /* Search results */
                <div className="p-2">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.url)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-start gap-3"
                    >
                      <div className="mt-1 text-blue-500">{result.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {result.description}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded capitalize">
                          {result.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* No results */
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>No results found for &quot;{query}&quot;</p>
                  <p className="text-sm mt-2">
                    Try searching for calculators, elements, or compounds
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
