'use client'

import React from 'react';
import { EnhancedCalculator } from '@/components/accessibility/enhanced-calculator';

export default function TestAccessibility() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Accessibility Test Page
        </h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Calculator
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This calculator includes full accessibility features. Try using keyboard shortcuts:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6">
            <li>Ctrl+Enter to calculate</li>
            <li>Ctrl+R to reset</li>
            <li>Ctrl+S to save result</li>
            <li>Ctrl+Z to undo</li>
          </ul>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <EnhancedCalculator
            title="Test Calculator"
            description="Accessible calculator with keyboard navigation"
            scientific={true}
            onCalculate={(expression, result) => {
              console.log('Calculation:', expression, '=', result);
            }}
            onError={(error) => {
              console.error('Calculator error:', error);
            }}
          />
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Accessibility Features
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Full keyboard navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Screen reader announcements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>ARIA labels and descriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Focus management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Error handling</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Test Instructions
              </h4>
              <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside">
                <li>Click on the calculator to focus it</li>
                <li>Try typing numbers with keyboard</li>
                <li>Use arrow keys to navigate buttons</li>
                <li>Press Enter to activate buttons</li>
                <li>Try the keyboard shortcuts listed above</li>
                <li>Enable high contrast mode in accessibility menu</li>
                <li>Test with screen reader if available</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}