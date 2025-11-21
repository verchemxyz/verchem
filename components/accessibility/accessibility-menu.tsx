'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '@/lib/accessibility/context';
import { useFocusManager } from '@/lib/accessibility/focus-manager';

interface AccessibilityMenuProps {
  className?: string;
}

export function AccessibilityMenu({ className = '' }: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const {
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    screenReaderMode,
    setScreenReaderMode,
    fontSize,
    setFontSize,
    announceToScreenReader,
    setShowShortcutsDialog
  } = useAccessibility();
  
  const { activateFocus, deactivateFocus } = useFocusManager(menuRef as React.RefObject<HTMLElement>, {
    trapFocus: true,
    returnFocus: true
  });
  
  // Handle menu open/close
  const handleToggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (newState) {
      announceToScreenReader('Accessibility menu opened');
      activateFocus();
    } else {
      announceToScreenReader('Accessibility menu closed');
      deactivateFocus();
    }
  };
  
  // Handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        deactivateFocus();
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        deactivateFocus();
        buttonRef.current?.focus();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, deactivateFocus]);
  
  // Handle setting changes
  const handleSettingChange = (setting: string, value: boolean | string, description: string) => {
    announceToScreenReader(`${description} ${value ? 'enabled' : 'disabled'}`);
  };
  
  const menuItems = [
    {
      id: 'high-contrast',
      label: 'High Contrast Mode',
      description: 'Increases color contrast for better visibility',
      checked: highContrast,
      onChange: (checked: boolean) => {
        setHighContrast(checked);
        handleSettingChange('High Contrast', checked, 'High contrast mode');
      }
    },
    {
      id: 'reduced-motion',
      label: 'Reduced Motion',
      description: 'Minimizes animations and transitions',
      checked: reducedMotion,
      onChange: (checked: boolean) => {
        setReducedMotion(checked);
        handleSettingChange('Reduced Motion', checked, 'Reduced motion');
      }
    },
    {
      id: 'screen-reader',
      label: 'Screen Reader Mode',
      description: 'Optimizes interface for screen readers',
      checked: screenReaderMode,
      onChange: (checked: boolean) => {
        setScreenReaderMode(checked);
        handleSettingChange('Screen Reader', checked, 'Screen reader mode');
      }
    }
  ];
  
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Accessibility settings"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="hidden sm:inline">Accessibility</span>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accessibility Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customize your accessibility preferences
            </p>
          </div>
          
          {/* Settings */}
          <div className="p-4 space-y-4">
            {/* Toggle Settings */}
            {menuItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={item.id}
                  checked={item.checked}
                  onChange={(e) => item.onChange(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  aria-describedby={`${item.id}-description`}
                />
                <div className="flex-1">
                  <label 
                    htmlFor={item.id} 
                    className="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                  >
                    {item.label}
                  </label>
                  <p id={`${item.id}-description`} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Font Size Setting */}
            <div className="space-y-2">
              <label htmlFor="font-size" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                Font Size
              </label>
              <select
                id="font-size"
                value={fontSize}
                onChange={(e) => {
                  const newSize = e.target.value as 'small' | 'medium' | 'large';
                  setFontSize(newSize);
                  announceToScreenReader(`Font size changed to ${newSize}`);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Select font size"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
          
          {/* Actions */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 space-y-2">
            <button
              onClick={() => {
                setShowShortcutsDialog(true);
                setIsOpen(false);
                announceToScreenReader('Keyboard shortcuts dialog opened');
              }}
              className="w-full px-3 py-2 text-sm text-left text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              aria-label="View all keyboard shortcuts"
            >
              View Keyboard Shortcuts
            </button>
            <button
              onClick={() => {
                // Reset all settings to defaults
                setHighContrast(false);
                setReducedMotion(false);
                setScreenReaderMode(false);
                setFontSize('medium');
                announceToScreenReader('All accessibility settings reset to defaults');
              }}
              className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              aria-label="Reset accessibility settings to defaults"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
