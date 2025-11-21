'use client';

import React, { useRef, useState } from 'react';
import {
  ExportButton,
  ExportDialog,
  PrintLayout,
  MolecularExport,
  CalculatorExport,
} from '@/components/export';

export default function ExportDemoPage() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const demoContentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Periodic table export can be tested via the dedicated periodic table page

  // Sample calculator results
  const calculatorResults = [
    { name: 'Molar Mass', value: '18.015', unit: 'g/mol', formula: 'H₂O' },
    { name: 'Density', value: '1.000', unit: 'g/cm³', formula: 'ρ = m/V' },
    { name: 'Boiling Point', value: '100.0', unit: '°C' },
    { name: 'pH', value: '7.00', unit: '', formula: '-log[H⁺]' }
  ];

  // Draw a simple molecular structure on canvas
  const drawMolecularStructure = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set styles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#333333';
    ctx.fillStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.font = '16px Arial';
    
    // Draw a simple benzene ring
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 60;
    
    // Draw hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw double bonds
    for (let i = 0; i < 6; i += 2) {
      const angle1 = (i * Math.PI) / 3;
      const angle2 = ((i + 1) * Math.PI) / 3;
      
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      const perpX = -(y2 - y1) / 10;
      const perpY = (x2 - x1) / 10;
      
      ctx.beginPath();
      ctx.moveTo(midX + perpX, midY + perpY);
      ctx.lineTo(midX - perpX, midY - perpY);
      ctx.stroke();
    }
    
    // Draw carbon atoms
    ctx.fillStyle = '#333333';
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add C label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('C', x, y + 4);
      ctx.fillStyle = '#333333';
    }
    
    // Add title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Benzene (C₆H₆)', centerX, 30);
    
    // Add formula
    ctx.font = '14px Arial';
    ctx.fillText('Aromatic hydrocarbon', centerX, canvas.height - 20);
  };

  // Initialize canvas drawing
  React.useEffect(() => {
    drawMolecularStructure();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            VerChem Export System Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of the comprehensive export capabilities for chemistry tools
          </p>
        </div>

        {/* Basic Export Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Simple Export Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Export Button
            </h2>
            
            <div ref={demoContentRef} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Sample Content for Export
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This is a demonstration of content that can be exported using the VerChem export system.
                It includes various elements like text, colors, and formatting.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                  <div className="text-blue-800 dark:text-blue-200 font-medium">Chemical Formula</div>
                  <div className="text-blue-600 dark:text-blue-400">H₂O</div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
                  <div className="text-green-800 dark:text-green-200 font-medium">Molar Mass</div>
                  <div className="text-green-600 dark:text-green-400">18.015 g/mol</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button Variants
                </h4>
                <div className="flex flex-wrap gap-2">
                  <ExportButton
                    elementRef={demoContentRef as React.RefObject<HTMLElement>}
                    filename="demo_export"
                    variant="button"
                    label="Export Content"
                  />
                  
                  <ExportButton
                    elementRef={demoContentRef as React.RefObject<HTMLElement>}
                    filename="demo_export"
                    variant="icon"
                  />
                  
                  <ExportButton
                    elementRef={demoContentRef as React.RefObject<HTMLElement>}
                    filename="demo_export"
                    variant="dropdown"
                    label="Export Options"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Advanced Export
                </h4>
                <button
                  onClick={() => setShowExportDialog(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Open Export Dialog
                </button>
              </div>
            </div>
          </div>

          {/* Molecular Structure Export */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Molecular Structure Export
            </h2>
            
            <div className="mb-4">
              <canvas
                ref={canvasRef}
                width={300}
                height={200}
                className="border border-gray-300 dark:border-gray-600 rounded-lg w-full"
              />
            </div>

            <MolecularExport
              canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
              moleculeName="benzene_structure"
              showPreview={true}
            />
          </div>
        </div>

        {/* Calculator Results Export */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Calculator Results Export
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {calculatorResults.map((result, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{result.name}</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {result.value}
                  {result.unit && <span className="text-sm ml-1">{result.unit}</span>}
                </div>
                {result.formula && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {result.formula}
                  </div>
                )}
              </div>
            ))}
          </div>

          <CalculatorExport
            results={calculatorResults}
            calculatorName="Chemical Properties Calculator"
          />
        </div>

        {/* Print Layout Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Print Layout Example
          </h2>
          
          <PrintLayout
            title="Chemical Analysis Report"
            subtitle="Laboratory Results Summary"
            showHeader={true}
            showFooter={true}
            showDate={true}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Sample Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sample ID</div>
                    <div className="font-medium">SAM-2024-001</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Date Collected</div>
                    <div className="font-medium">2024-01-15</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sample Type</div>
                    <div className="font-medium">Water</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                    <div className="font-medium">Site A, River Bank</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Test Results
                </h3>
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Parameter</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Result</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Unit</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">pH</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">7.2</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">-</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Electrometric</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Dissolved Oxygen</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">8.5</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">mg/L</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Winkler</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Turbidity</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">2.1</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">NTU</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Nephelometric</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Quality Control
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                    <div className="text-green-800 dark:text-green-200 font-medium">QC Sample</div>
                    <div className="text-green-600 dark:text-green-400 text-sm">Passed</div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                    <div className="text-green-800 dark:text-green-200 font-medium">Duplicate</div>
                    <div className="text-green-600 dark:text-green-400 text-sm">Within Limits</div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                    <div className="text-green-800 dark:text-green-200 font-medium">Blank</div>
                    <div className="text-green-600 dark:text-green-400 text-sm">Acceptable</div>
                  </div>
                </div>
              </div>
            </div>
          </PrintLayout>
        </div>

        {/* Export System Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Export System Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Multiple Formats</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• PNG (high-resolution images)</li>
                <li>• JPEG (compressed images)</li>
                <li>• SVG (scalable vector graphics)</li>
                <li>• PDF (documents with metadata)</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Quality Options</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Low (72 DPI) - Web optimized</li>
                <li>• Medium (150 DPI) - Standard</li>
                <li>• High (300 DPI) - Print quality</li>
                <li>• Ultra (600 DPI) - Publication</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Advanced Features</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Watermark support</li>
                <li>• Timestamp inclusion</li>
                <li>• Batch export capabilities</li>
                <li>• Custom branding options</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Chemistry Specific</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 3D molecular structures</li>
                <li>• Periodic table exports</li>
                <li>• Calculator results</li>
                <li>• Lewis structures</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Print Support</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Print-optimized layouts</li>
                <li>• Page headers and footers</li>
                <li>• Professional formatting</li>
                <li>• Report generation</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">User Experience</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Easy-to-use interface</li>
                <li>• Real-time preview</li>
                <li>• Progress indicators</li>
                <li>• Error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          elementRef={demoContentRef as React.RefObject<HTMLElement>}
          title="Export Demo Content"
          defaultFilename="demo_content"
          showPreview={true}
        />
      )}
    </div>
  );
}
