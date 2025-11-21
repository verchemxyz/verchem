'use client';

import React, { useRef } from 'react';
import { ExportButton } from '@/components/export';

export default function ExportTestPage() {
  const testContentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Export System Test
          </h1>
          
          <div ref={testContentRef} className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Test Content for Export
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This is a simple test to verify the export system is working correctly.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded">
                <div className="text-blue-800 dark:text-blue-200 font-medium">Test Data 1</div>
                <div className="text-blue-600 dark:text-blue-400">Value: 42</div>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-800 rounded">
                <div className="text-green-800 dark:text-green-200 font-medium">Test Data 2</div>
                <div className="text-green-600 dark:text-green-400">Value: 3.14</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <ExportButton
              elementRef={testContentRef as React.RefObject<HTMLElement>}
              filename="test_export"
              variant="button"
              label="Export as PNG"
              defaultFormat="png"
            />
            
            <ExportButton
              elementRef={testContentRef as React.RefObject<HTMLElement>}
              filename="test_export"
              variant="button"
              label="Export as PDF"
              defaultFormat="pdf"
            />
            
            <ExportButton
              elementRef={testContentRef as React.RefObject<HTMLElement>}
              filename="test_export"
              variant="button"
              label="Export as SVG"
              defaultFormat="svg"
            />
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Test Instructions
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Click any export button to test the functionality</li>
              <li>• The export should download a file with the test content</li>
              <li>• Check that the file contains the colored test data boxes</li>
              <li>• Verify different formats work correctly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}