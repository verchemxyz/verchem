'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { usePreferences } from '@/lib/preferences/context';
import { PREFERENCE_CATEGORIES, LANGUAGES } from '@/lib/preferences/defaults';
import { PreferenceCategory } from '@/lib/preferences/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, ChevronRight, Settings, Accessibility, Calculator, Box, Atom, Download, Keyboard, Layout, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  general: Settings,
  accessibility: Accessibility,
  calculator: Calculator,
  viewer3d: Box,
  moleculeBuilder: Atom,
  export: Download,
  keyboard: Keyboard,
  ui: Layout,
  privacy: Shield,
} as const;

interface SearchResult {
  category: PreferenceCategory;
  key: string;
  label: string;
  value: unknown;
  path: string[];
  matches: number;
}

interface SettingsSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  showCategories?: boolean;
  maxResults?: number;
}

export function SettingsSearch({
  onResultClick,
  placeholder = "Search settings...",
  className,
  showCategories = true,
  maxResults = 10,
}: SettingsSearchProps) {
  const { preferences } = usePreferences();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Build searchable index
  const searchIndex = useMemo(() => {
    const index: SearchResult[] = [];
    
    Object.entries(preferences).forEach(([categoryKey, categoryData]) => {
      if (categoryKey === 'version' || categoryKey === 'lastUpdated' || categoryKey === 'userId') return;
      
      const category = categoryKey as PreferenceCategory;
      const categoryInfo = PREFERENCE_CATEGORIES[category];
      
      Object.entries(categoryData).forEach(([key, value]) => {
        // Generate human-readable labels
        const label = generateLabel(category, key);
        
        index.push({
          category,
          key,
          label,
          value,
          path: [categoryInfo.label, label],
          matches: 0,
        });
      });
    });
    
    return index;
  }, [preferences]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    const results: SearchResult[] = [];
    
    searchIndex.forEach((item) => {
      let matches = 0;
      
      // Search in label
      if (item.label.toLowerCase().includes(term)) {
        matches += 2;
      }
      
      // Search in category
      if (PREFERENCE_CATEGORIES[item.category].label.toLowerCase().includes(term)) {
        matches += 1;
      }
      
      // Search in value
      if (String(item.value).toLowerCase().includes(term)) {
        matches += 1;
      }
      
      // Search in key name
      if (item.key.toLowerCase().includes(term)) {
        matches += 0.5;
      }
      
      if (matches > 0) {
        results.push({ ...item, matches });
      }
    });
    
    // Sort by relevance (matches) and then alphabetically
    results.sort((a, b) => {
      if (b.matches !== a.matches) return b.matches - a.matches;
      return a.label.localeCompare(b.label);
    });
    
    return results.slice(0, maxResults);
  }, [searchTerm, searchIndex, maxResults]);

  // Handle keyboard navigation
  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick?.(result);
    setIsSearching(false);
    setSearchTerm('');
    setSelectedIndex(0);
  }, [onResultClick]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSearching) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsSearching(false);
          setSearchTerm('');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearching, searchResults, selectedIndex, handleResultClick]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsSearching(value.length > 0);
    setSelectedIndex(0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearching(searchTerm.length > 0)}
          className="pl-9 pr-9"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {isSearching && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[400px] overflow-hidden">
          <ScrollArea className="h-full">
            <div ref={resultsRef} className="p-2">
              {searchResults.map((result, index) => {
                const Icon = ICONS[result.category];
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={`${result.category}-${result.key}`}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      'hover:bg-muted/50 focus:bg-muted/50 focus:outline-none',
                      isSelected && 'bg-muted'
                    )}
                    onClick={() => handleResultClick(result)}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {PREFERENCE_CATEGORIES[result.category].label}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatValue(result.value)}
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* No Results */}
      {isSearching && searchResults.length === 0 && searchTerm.trim() && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-4">
          <div className="text-center text-sm text-muted-foreground">
            No settings found for &quot;{searchTerm}&quot;
          </div>
        </Card>
      )}

      {/* Category Overview (when not searching) */}
      {!isSearching && showCategories && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[400px] overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              {Object.entries(PREFERENCE_CATEGORIES).map(([categoryKey, category]) => {
                const Icon = ICONS[categoryKey as PreferenceCategory];
                const categoryPrefs = preferences[categoryKey as PreferenceCategory];
                const settingCount = Object.keys(categoryPrefs).length - 3; // Exclude version, lastUpdated, userId
                
                return (
                  <button
                    key={categoryKey}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                    onClick={() => {
                      // Could open preferences panel to this category
                    }}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{category.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {category.description}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {settingCount} settings
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function generateLabel(category: PreferenceCategory, key: string): string {
  // Special cases for better labels
  const labelMap: Record<string, Record<string, string>> = {
    general: {
      theme: 'Theme',
      language: 'Language',
      region: 'Region',
      autoDetectLanguage: 'Auto-detect language',
      timezone: 'Timezone',
      dateFormat: 'Date format',
      timeFormat: 'Time format',
    },
    accessibility: {
      highContrast: 'High contrast mode',
      fontSize: 'Font size',
      reducedMotion: 'Reduce motion',
      screenReaderAnnouncements: 'Screen reader announcements',
      keyboardNavigation: 'Keyboard navigation',
      focusIndicators: 'Focus indicators',
    },
    calculator: {
      decimalPlaces: 'Decimal places',
      scientificNotation: 'Scientific notation',
      significantFigures: 'Significant figures',
      unitSystem: 'Unit system',
      autoCalculate: 'Auto-calculate',
      showSteps: 'Show calculation steps',
      resultFormat: 'Result format',
    },
    viewer3d: {
      autoRotate: 'Auto-rotate',
      autoRotateSpeed: 'Auto-rotate speed',
      displayStyle: 'Display style',
      backgroundColor: 'Background color',
      atomColors: 'Atom colors',
      quality: 'Quality',
      antiAliasing: 'Anti-aliasing',
      shadows: 'Shadows',
    },
    moleculeBuilder: {
      gridSize: 'Grid size',
      snapToGrid: 'Snap to grid',
      showGrid: 'Show grid',
      autoSave: 'Auto-save',
      validationEnabled: 'Validation enabled',
      defaultAtom: 'Default atom',
      bondType: 'Bond type',
      tooltips: 'Tooltips',
    },
    export: {
      defaultFormat: 'Default format',
      imageQuality: 'Image quality',
      resolution: 'Resolution',
      transparentBackground: 'Transparent background',
      includeWatermark: 'Include watermark',
      watermarkText: 'Watermark text',
      colorProfile: 'Color profile',
    },
    keyboard: {
      enabled: 'Keyboard shortcuts enabled',
      customBindings: 'Custom bindings',
      showHints: 'Show hints',
      vimMode: 'Vim mode',
    },
    ui: {
      sidebarPosition: 'Sidebar position',
      compactMode: 'Compact mode',
      showTooltips: 'Show tooltips',
      animationSpeed: 'Animation speed',
      density: 'Density',
      tabPosition: 'Tab position',
    },
    privacy: {
      analyticsEnabled: 'Analytics enabled',
      dataSharing: 'Data sharing',
      cloudSync: 'Cloud sync',
      localStorageOnly: 'Local storage only',
      encryptionEnabled: 'Encryption enabled',
    },
  };

  return labelMap[category]?.[key] || formatKeyToLabel(key);
}

function formatKeyToLabel(key: string): string {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'On' : 'Off';
  }
  if (typeof value === 'string') {
    // Handle language codes
    if (value.length === 2 && LANGUAGES[value as keyof typeof LANGUAGES]) {
      return LANGUAGES[value as keyof typeof LANGUAGES].name;
    }
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `${value.length} items`;
  }
  if (typeof value === 'object' && value !== null) {
    return `${Object.keys(value).length} settings`;
  }
  return String(value);
}
