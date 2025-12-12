'use client';

import React, { useState, useRef } from 'react';
import { ExportManager } from '@/lib/export/export-manager';
import ExportDialog from './ExportDialog';

interface MolecularExportProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  moleculeName?: string;
  showPreview?: boolean;
  className?: string;
}

const MolecularExport: React.FC<MolecularExportProps> = ({
  canvasRef,
  moleculeName = 'molecular_structure',
  showPreview = true,
  className = ''
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport3D = async (format: 'png' | 'svg' | 'pdf') => {
    if (!canvasRef?.current) {
      console.error('No canvas reference provided');
      return;
    }

    try {
      await ExportManager.export3DStructure(canvasRef.current, {
        format,
        filename: moleculeName,
        quality: 'high',
        includeTimestamp: true
      });
    } catch (error) {
      console.error('3D structure export failed:', error);
    }
  };

  return (
    <div ref={containerRef} className={className}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Molecular Structure Export
        </h3>
        
        <div className="flex gap-1">
          <button
            onClick={() => handleExport3D('png')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Export as high-resolution PNG"
          >
            PNG
          </button>
          
          <button
            onClick={() => handleExport3D('svg')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Export as scalable SVG"
          >
            SVG
          </button>
          
          <button
            onClick={() => handleExport3D('pdf')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Export as PDF document"
          >
            PDF
          </button>
          
          <button
            onClick={() => setShowExportDialog(true)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Advanced export options"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h4 className="font-medium mb-2">Export Options:</h4>
          <ul className="space-y-1">
            <li>• PNG: High-resolution raster image</li>
            <li>• SVG: Scalable vector graphics</li>
            <li>• PDF: Document format with metadata</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Best Practices:</h4>
          <ul className="space-y-1">
            <li>• Use PNG for presentations</li>
            <li>• Use SVG for publications</li>
            <li>• Use PDF for reports</li>
          </ul>
        </div>
      </div>

      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          elementRef={containerRef as React.RefObject<HTMLElement>}
          title="Export Molecular Structure"
          defaultFilename={moleculeName}
          availableFormats={['png', 'svg', 'pdf']}
          showPreview={showPreview}
        />
      )}
    </div>
  );
};

interface CalculatorExportProps {
  results: Array<{
    name: string;
    value: string;
    unit?: string;
    formula?: string;
  }>;
  calculatorName: string;
  className?: string;
}

export const CalculatorExport: React.FC<CalculatorExportProps> = ({
  results,
  calculatorName,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportResults = async (format: 'pdf' | 'png') => {
    setIsExporting(true);

    try {
      if (format === 'pdf') {
        await ExportManager.exportCalculatorResults(results, calculatorName, {
          quality: 'high',
          includeTimestamp: true,
          format: 'pdf'
        });
      } else {
        // For PNG export, create a results table element using safe DOM methods
        // SECURITY: Using textContent instead of innerHTML to prevent XSS
        const resultsElement = document.createElement('div');
        resultsElement.className = 'p-6 bg-white dark:bg-gray-800';

        // Create header
        const header = document.createElement('h2');
        header.className = 'text-xl font-bold mb-4 text-gray-900 dark:text-gray-100';
        header.textContent = `${calculatorName} Results`;
        resultsElement.appendChild(header);

        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'space-y-3';

        // Add each result safely
        results.forEach(result => {
          const resultDiv = document.createElement('div');
          resultDiv.className = 'border-b border-gray-200 dark:border-gray-700 pb-2';

          const nameDiv = document.createElement('div');
          nameDiv.className = 'font-medium text-gray-900 dark:text-gray-100';
          nameDiv.textContent = result.name;
          resultDiv.appendChild(nameDiv);

          const valueDiv = document.createElement('div');
          valueDiv.className = 'text-lg text-blue-600 dark:text-blue-400';
          valueDiv.textContent = `${result.value} ${result.unit || ''}`.trim();
          resultDiv.appendChild(valueDiv);

          if (result.formula) {
            const formulaDiv = document.createElement('div');
            formulaDiv.className = 'text-sm text-gray-600 dark:text-gray-400';
            formulaDiv.textContent = `Formula: ${result.formula}`;
            resultDiv.appendChild(formulaDiv);
          }

          resultsContainer.appendChild(resultDiv);
        });

        resultsElement.appendChild(resultsContainer);

        // Add timestamp
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'mt-4 text-xs text-gray-500 dark:text-gray-500';
        timestampDiv.textContent = `Generated on ${new Date().toLocaleString()}`;
        resultsElement.appendChild(timestampDiv);

        document.body.appendChild(resultsElement);

        await ExportManager.exportElement(resultsElement, {
          format: 'png',
          filename: `${calculatorName}_results`,
          quality: 'high',
          includeTimestamp: true
        });

        document.body.removeChild(resultsElement);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export Results
        </h3>
        
        <button
          onClick={() => handleExportResults('pdf')}
          disabled={isExporting}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          PDF
        </button>
        
        <button
          onClick={() => handleExportResults('png')}
          disabled={isExporting}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          PNG
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>Export your calculation results in a formatted document or image.</p>
      </div>
    </div>
  );
};

interface PeriodicTableExportProps {
  tableElement: React.RefObject<HTMLElement>;
  className?: string;
}

export const PeriodicTableExport: React.FC<PeriodicTableExportProps> = ({
  tableElement,
  className = ''
}) => {
  const handleExport = async (format: 'png' | 'pdf' | 'svg') => {
    if (!tableElement.current) {
      console.error('No table element reference provided');
      return;
    }

    try {
      await ExportManager.exportPeriodicTable(tableElement.current, {
        format,
        filename: 'periodic_table',
        quality: 'ultra',
        includeTimestamp: true
      });
    } catch (error) {
      console.error('Periodic table export failed:', error);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export Periodic Table
        </h3>
        
        <button
          onClick={() => handleExport('png')}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          PNG
        </button>
        
        <button
          onClick={() => handleExport('svg')}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          SVG
        </button>
        
        <button
          onClick={() => handleExport('pdf')}
          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          PDF
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>Export the periodic table in high resolution for printing or digital use.</p>
      </div>
    </div>
  );
};

export default MolecularExport;
