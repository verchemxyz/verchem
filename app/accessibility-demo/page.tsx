'use client';

import React from 'react';
import { EnhancedCalculator } from '@/components/accessibility/enhanced-calculator';
import { Enhanced3DViewer } from '@/components/accessibility/enhanced-3d-viewer';
import { SkipLinks } from '@/components/accessibility/skip-links';

export default function AccessibilityDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip links for this page */}
      <SkipLinks 
        links={[
          { id: 'skip-demo-nav', text: 'Skip to demo navigation', targetId: 'demo-navigation' },
          { id: 'skip-calculator', text: 'Skip to calculator', targetId: 'calculator-section' },
          { id: 'skip-viewer', text: 'Skip to 3D viewer', targetId: 'viewer-section' },
          { id: 'skip-features', text: 'Skip to features list', targetId: 'features-section' }
        ]}
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Accessibility Demo
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Experience VerChem&apos;s comprehensive accessibility features
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <p className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold">
                Press <kbd className="px-1 py-0.5 text-xs font-mono bg-blue-50 border border-blue-200 rounded">Ctrl+/</kbd> to view keyboard shortcuts
              </p>
              <a
                href="#features-section"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Navigation */}
      <nav id="demo-navigation" className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#calculator-section" className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Calculator Demo
            </a>
            <a href="#viewer-section" className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500">
              3D Viewer Demo
            </a>
            <a href="#features-section" className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500">
              Feature List
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Introduction */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              WCAG 2.1 AA Compliant
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              VerChem is built with accessibility as a core principle. Our platform meets WCAG 2.1 AA standards, 
              ensuring that chemistry education is accessible to everyone, regardless of their abilities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Keyboard Navigation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete keyboard navigation with customizable shortcuts for all functions
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Screen Reader Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Full ARIA label support and live regions for dynamic content updates
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Visual Accessibility
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                High contrast mode, font scaling, and reduced motion options
              </p>
            </div>
          </div>
        </section>

        {/* Calculator Demo */}
        <section id="calculator-section" className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Accessible Calculator
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Our calculator features full keyboard navigation, screen reader announcements, 
              and scientific mode with accessible controls.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <EnhancedCalculator
                title="Chemistry Calculator"
                description="Perform chemical calculations with full accessibility support"
                scientific={true}
                onCalculate={(expression, result) => {
                  console.log('Calculation:', expression, '=', result);
                }}
                onError={(error) => {
                  console.error('Calculator error:', error);
                }}
              />
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Calculator Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Full keyboard navigation with customizable shortcuts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Screen reader announcements for all operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Scientific mode with accessible function buttons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Calculation history with keyboard navigation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Error handling with accessible error messages</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Try These Shortcuts
                </h4>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex justify-between">
                    <span>Calculate result:</span>
                    <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Ctrl+Enter</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset calculator:</span>
                    <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Ctrl+R</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Save result:</span>
                    <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Ctrl+S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Undo last action:</span>
                    <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Ctrl+Z</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Viewer Demo */}
        <section id="viewer-section" className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Accessible 3D Viewer
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Navigate 3D molecular structures using keyboard controls with full screen reader support 
              and customizable viewing options.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <Enhanced3DViewer
                title="3D Molecular Viewer"
                description="Interactive 3D visualization with keyboard navigation"
                molecule="water"
                onControlsChange={(controls) => {
                  console.log('Viewer controls changed:', controls);
                }}
              />
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Viewer Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Keyboard navigation with arrow keys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Screen reader announcements for all actions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Zoom controls with keyboard shortcuts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Auto-rotation with space bar toggle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Status information for current view state</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
                  Navigation Controls
                </h4>
                <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                  <div className="flex justify-between">
                    <span>Rotate up/down:</span>
                    <kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded text-xs">↑ / ↓</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Rotate left/right:</span>
                    <kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded text-xs">← / →</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Zoom in/out:</span>
                    <kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded text-xs">+ / -</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-rotate:</span>
                    <kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded text-xs">Space</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset view:</span>
                    <kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded text-xs">R</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features List */}
        <section id="features-section" className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Complete Accessibility Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              A comprehensive overview of all accessibility features implemented in VerChem
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Keyboard Navigation */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Keyboard Navigation
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Global shortcuts for navigation</li>
                <li>• Context-specific tool shortcuts</li>
                <li>• Calculator number pad support</li>
                <li>• 3D viewer rotation controls</li>
                <li>• Molecule builder tools</li>
                <li>• Modal dialog focus management</li>
              </ul>
            </div>
            
            {/* Screen Reader Support */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Screen Reader Support
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• ARIA labels and descriptions</li>
                <li>• Live regions for updates</li>
                <li>• Semantic HTML structure</li>
                <li>• Role-based navigation</li>
                <li>• Status announcements</li>
                <li>• Error message alerts</li>
              </ul>
            </div>
            
            {/* Visual Accessibility */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Visual Accessibility
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• High contrast mode</li>
                <li>• Font size scaling</li>
                <li>• Reduced motion options</li>
                <li>• Focus indicators</li>
                <li>• Color contrast compliance</li>
                <li>• Alternative text for images</li>
              </ul>
            </div>
            
            {/* Navigation Aids */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Navigation Aids
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Skip navigation links</li>
                <li>• Breadcrumb navigation</li>
                <li>• Clear page structure</li>
                <li>• Consistent navigation</li>
                <li>• Page landmarks</li>
                <li>• Heading hierarchy</li>
              </ul>
            </div>
            
            {/* Interactive Elements */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Interactive Elements
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Large touch targets (44px+)</li>
                <li>• Keyboard accessible forms</li>
                <li>• Focus management</li>
                <li>• Error prevention</li>
                <li>• Clear instructions</li>
                <li>• Feedback mechanisms</li>
              </ul>
            </div>
            
            {/* Content Accessibility */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Content Accessibility
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Clear language and structure</li>
                <li>• Alternative content formats</li>
                <li>• Consistent terminology</li>
                <li>• Error identification</li>
                <li>• Help and instructions</li>
                <li>• Multiple input methods</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testing and Compliance */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-8 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Testing and Compliance
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  WCAG 2.1 AA Compliance
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Perceivable - Text alternatives, captions, contrast</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Operable - Keyboard accessible, enough time, navigation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Understandable - Readable, predictable, input assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Robust - Compatible with assistive technologies</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Testing Methods
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">→</span>
                    <span>Automated accessibility testing tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">→</span>
                    <span>Manual keyboard navigation testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">→</span>
                    <span>Screen reader compatibility testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">→</span>
                    <span>User testing with people with disabilities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Try our accessible chemistry tools and experience inclusive design in action
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/periodic-table"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Periodic Table (Alt+N)
            </a>
            <a
              href="/3d-viewer"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Try 3D Viewer (Alt+3)
            </a>
            <a
              href="/molecule-builder"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Try Molecule Builder (Alt+M)
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
