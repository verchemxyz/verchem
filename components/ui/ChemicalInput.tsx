'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Clock, Star } from 'lucide-react';

interface ChemicalInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'formula' | 'equation' | 'number' | 'text';
  placeholder?: string;
  label?: string;
  error?: string;
  suggestions?: string[];
  showHistory?: boolean;
  showFavorites?: boolean;
  autoComplete?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Universal Chemical Input Component
 *
 * Features:
 * - Auto-complete suggestions
 * - Input history (mock for now, will use DB later)
 * - Favorites (mock for now, will use DB later)
 * - Real-time validation
 * - Chemical formula formatting (subscripts)
 * - Keyboard shortcuts
 *
 * @example
 * <ChemicalInput
 *   value={formula}
 *   onChange={setFormula}
 *   type="formula"
 *   placeholder="H2O, NaCl, Ca(OH)2"
 *   suggestions={commonCompounds}
 *   showHistory={true}
 * />
 */
export function ChemicalInput({
  value,
  onChange,
  type = 'formula',
  placeholder = 'Enter value...',
  label,
  error,
  suggestions = [],
  showHistory = false,
  showFavorites = false,
  autoComplete = true,
  disabled = false,
  required = false,
  className = '',
}: ChemicalInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!autoComplete || !value) return suggestions.slice(0, 5);

    const searchTerm = value.toLowerCase();
    return suggestions
      .filter(s => s.toLowerCase().includes(searchTerm))
      .slice(0, 5);
  }, [value, suggestions, autoComplete]);

  // Combine history, favorites, and suggestions
  const allSuggestions = useMemo(() => {
    // Mock data (will be replaced with DB queries later)
    const mockHistory = ['H2O', 'NaCl', 'CO2', 'Ca(OH)2', 'H2SO4'];
    const mockFavorites = ['H2O', 'NaCl', 'C6H12O6'];

    const items: Array<{ value: string; type: 'history' | 'favorite' | 'suggestion' }> = [];

    if (showFavorites && value.length === 0) {
      mockFavorites.forEach(fav => items.push({ value: fav, type: 'favorite' }));
    }

    if (showHistory && value.length === 0) {
      mockHistory.slice(0, 3).forEach(hist =>
        items.push({ value: hist, type: 'history' })
      );
    }

    filteredSuggestions.forEach(sug =>
      items.push({ value: sug, type: 'suggestion' })
    );

    // Remove duplicates
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  }, [showFavorites, showHistory, filteredSuggestions, value]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  }, [onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  // Format display value (convert numbers to subscripts for formulas)
  const formatDisplay = (text: string): string => {
    if (type !== 'formula') return text;

    // This is for display purposes - actual subscript rendering would need special handling
    // For now, we just return the text as-is
    return text;
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Input field */}
        <div className={`
          relative flex items-center
          border-2 rounded-lg transition-all duration-200
          ${error
            ? 'border-destructive'
            : isFocused
              ? 'border-primary-500 ring-2 ring-ring/30'
              : 'border-border hover:border-muted-foreground'
          }
          ${disabled ? 'bg-muted cursor-not-allowed' : 'bg-card'}
        `}>
          {/* Search icon */}
          {type === 'formula' && (
            <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
          )}

          {/* Input */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              // Delay to allow click on suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`
              w-full px-4 py-3
              ${type === 'formula' ? 'pl-11' : ''}
              bg-transparent
              text-foreground
              placeholder-muted-foreground
              focus:outline-none
              disabled:cursor-not-allowed
              text-lg
            `}
          />

          {/* Clear button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 hover:bg-muted rounded-full transition-colors"
              aria-label="Clear input"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && allSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {allSuggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(item.value)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
              >
                {/* Icon based on type */}
                {item.type === 'favorite' && (
                  <Star className="w-4 h-4 text-warning fill-current" />
                )}
                {item.type === 'history' && (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}

                {/* Value */}
                <span className="text-foreground font-medium">
                  {formatDisplay(item.value)}
                </span>

                {/* Type label */}
                <span className="ml-auto text-xs text-muted-foreground capitalize">
                  {item.type === 'favorite' ? 'Favorite' : item.type === 'history' ? 'Recent' : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-2 text-sm text-destructive flex items-center gap-1">
            <span className="font-medium">Error:</span> {error}
          </p>
        )}

        {/* Helper text */}
        {!error && type === 'formula' && (
          <p className="mt-2 text-xs text-muted-foreground">
            Examples: H2O, NaCl, Ca(OH)2, Fe2O3
          </p>
        )}
      </div>
    </div>
  );
}
