'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility/context';
import { 
  ALL_SHORTCUTS, 
  ShortcutCategory 
} from '@/lib/accessibility/keyboard-shortcuts';
import { ARIA_LABELS } from '@/lib/accessibility/aria-labels';

interface KeyboardShortcutsDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  [ShortcutCategory.NAVIGATION]: 'Navigation',
  [ShortcutCategory.TOOLS]: 'Tools',
  [ShortcutCategory.CALCULATOR]: 'Calculator',
  [ShortcutCategory.VIEWER_3D]: '3D Viewer',
  [ShortcutCategory.MOLECULE_BUILDER]: 'Molecule Builder',
  [ShortcutCategory.GENERAL]: 'General'
};

const CATEGORY_DESCRIPTIONS: Record<ShortcutCategory, string> = {
  [ShortcutCategory.NAVIGATION]: 'Shortcuts for navigating between different sections of the application',
  [ShortcutCategory.TOOLS]: 'Shortcuts for accessing various tools and features',
  [ShortcutCategory.CALCULATOR]: 'Shortcuts for using the chemistry calculators',
  [ShortcutCategory.VIEWER_3D]: 'Shortcuts for controlling the 3D molecular viewer',
  [ShortcutCategory.MOLECULE_BUILDER]: 'Shortcuts for building and editing molecules',
  [ShortcutCategory.GENERAL]: 'General application shortcuts'
};

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const { showShortcutsDialog, setShowShortcutsDialog, announceToScreenReader } = useAccessibility();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');
  
  const isDialogOpen = isOpen ?? showShortcutsDialog;
  const handleClose = onClose ?? (() => setShowShortcutsDialog(false));
  
  // Filter shortcuts based on search and category
  const filteredShortcuts = ALL_SHORTCUTS.filter(shortcut => {
    const matchesSearch = shortcut.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Group shortcuts by category
  const shortcutsByCategory = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<ShortcutCategory, typeof ALL_SHORTCUTS>);
  
  // Handle keyboard navigation within the dialog
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
      announceToScreenReader('Keyboard shortcuts dialog closed');
    }
  };
  
  // Focus management
  useEffect(() => {
    if (isDialogOpen) {
      announceToScreenReader('Keyboard shortcuts dialog opened');
      // Focus the search input when dialog opens
      const searchInput = document.querySelector('[data-shortcuts-search]') as HTMLInputElement;
      searchInput?.focus();
    }
  }, [isDialogOpen, announceToScreenReader]);
  
  if (!isDialogOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="shortcuts-dialog-title"
      aria-describedby="shortcuts-dialog-description"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="shortcuts-dialog-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p id="shortcuts-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete list of keyboard shortcuts for VerChem
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={ARIA_LABELS.close}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="shortcuts-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search shortcuts
              </label>
              <input
                id="shortcuts-search"
                data-shortcuts-search
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type a key or description..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Search keyboard shortcuts"
              />
            </div>
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ShortcutCategory | 'all')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Filter shortcuts by category"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                  <option key={category} value={category}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.entries(shortcutsByCategory).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No shortcuts found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
                <section key={category} className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {CATEGORY_LABELS[category as ShortcutCategory]}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {CATEGORY_DESCRIPTIONS[category as ShortcutCategory]}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div 
                        key={`${shortcut.key}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {shortcut.description}
                          </div>
                          {shortcut.global && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Global shortcut
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {shortcut.key.split('+').map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {keyIndex > 0 && (
                                <span className="text-gray-400 dark:text-gray-500">+</span>
                              )}
                              <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm text-gray-700 dark:text-gray-200">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              Press <kbd className="px-1 py-0.5 text-xs font-mono bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded">Escape</kbd> to close
            </div>
            <div>
              {filteredShortcuts.length} shortcut{filteredShortcuts.length !== 1 ? 's' : ''} shown
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
