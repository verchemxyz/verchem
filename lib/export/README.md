# VerChem Export System

A comprehensive, professional export system for VerChem that supports multiple formats including PNG, SVG, PDF, and more. Designed specifically for chemistry applications with support for molecular structures, periodic tables, calculator results, and scientific reports.

## Features

### 🎯 Multiple Export Formats
- **PNG**: High-resolution raster images (up to 600 DPI)
- **JPEG**: Compressed images for web use
- **SVG**: Scalable vector graphics for publications
- **PDF**: Professional documents with metadata

### 🔬 Chemistry-Specific Exports
- **3D Molecular Structures**: Export from canvas elements
- **Periodic Table**: High-resolution table exports
- **Calculator Results**: Formatted scientific results
- **Lewis Structures**: Vector-based structure diagrams
- **Scientific Reports**: Complete reports with citations

### ⚙️ Advanced Options
- **Quality Settings**: Low (72 DPI) to Ultra (600 DPI)
- **Watermarks**: Custom text and positioning
- **Timestamps**: Automatic filename timestamps
- **Batch Export**: Multiple elements at once
- **Custom Branding**: Logo and styling options

### 🖨️ Print Support
- **Print Layouts**: Optimized for printing
- **Page Headers/Footers**: Professional formatting
- **Report Generation**: Complete document creation
- **High-Resolution**: Publication-ready quality

## Installation

The export system is already integrated into VerChem. Required dependencies:

```bash
npm install html2canvas jspdf svg2pdf.js canvg file-saver @types/file-saver
```

## Quick Start

### Basic Export Button

```tsx
import { ExportButton } from '@/components/export';

function MyComponent() {
  const contentRef = useRef<HTMLDivElement>(null);
  
  return (
    <div>
      <div ref={contentRef}>
        {/* Your content here */}
      </div>
      <ExportButton
        elementRef={contentRef}
        filename="my_export"
        variant="button"
        label="Export"
      />
    </div>
  );
}
```

### Export Dialog

```tsx
import { ExportDialog } from '@/components/export';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Open Export Dialog
      </button>
      
      <ExportDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        elementRef={contentRef}
        title="Export Content"
        showPreview={true}
      />
    </>
  );
}
```

### Programmatic Export

```tsx
import { ExportManager } from '@/lib/export';

// Export element to PNG
await ExportManager.exportElement(element, {
  format: 'png',
  quality: 'high',
  filename: 'my_image',
  includeTimestamp: true
});

// Export 3D structure
await ExportManager.export3DStructure(canvas, {
  format: 'svg',
  filename: 'molecule'
});

// Export calculator results
await ExportManager.exportCalculatorResults(results, 'Calculator Name');

// Create report
await ExportManager.exportReport('Report Title', sections);
```

## Components

### ExportButton

A versatile export button with multiple variants:

```tsx
<ExportButton
  elementRef={contentRef}
  filename="export"
  formats={['png', 'pdf', 'svg']}
  defaultFormat="png"
  defaultQuality="high"
  variant="button" // 'button', 'icon', 'dropdown'
  size="md" // 'sm', 'md', 'lg'
  showQuality={true}
  showTimestamp={true}
  showWatermark={false}
  onExportStart={() => console.log('Export started')}
  onExportComplete={(success) => console.log('Export completed:', success)}
  onExportError={(error) => console.error('Export failed:', error)}
/>
```

### ExportDialog

A comprehensive export dialog with preview:

```tsx
<ExportDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  elementRef={contentRef}
  title="Export Content"
  defaultFilename="export"
  availableFormats={['png', 'pdf', 'svg']}
  showPreview={true}
  onExportStart={() => console.log('Export started')}
  onExportComplete={(success) => console.log('Export completed:', success)}
  onExportError={(error) => console.error('Export failed:', error)}
/>
```

### PrintLayout

A wrapper component for print-optimized layouts:

```tsx
<PrintLayout
  title="Report Title"
  subtitle="Report Subtitle"
  showHeader={true}
  showFooter={true}
  showDate={true}
  customHeader={<MyCustomHeader />}
  customFooter={<MyCustomFooter />}
>
  {/* Your content here */}
</PrintLayout>
```

### Specialized Components

#### MolecularExport

For exporting molecular structures and 3D visualizations:

```tsx
<MolecularExport
  canvasRef={canvasRef}
  moleculeName="benzene_structure"
  showPreview={true}
/>
```

#### CalculatorExport

For exporting calculator results:

```tsx
<CalculatorExport
  results={[
    { name: 'Molar Mass', value: '18.015', unit: 'g/mol', formula: 'H₂O' },
    { name: 'Density', value: '1.000', unit: 'g/cm³' }
  ]}
  calculatorName="Chemical Properties Calculator"
/>
```

#### PeriodicTableExport

For exporting periodic tables:

```tsx
<PeriodicTableExport
  tableElement={tableRef}
/>
```

## Utility Classes

### CanvasExporter

```tsx
import { CanvasExporter } from '@/lib/export/canvas-export';

// Convert element to canvas
const canvas = await CanvasExporter.elementToCanvas(element, {
  scale: 2,
  backgroundColor: '#ffffff'
});

// Export to PNG
const blob = await CanvasExporter.elementToPNG(element, options);

// Add watermark
const watermarkedCanvas = await CanvasExporter.addWatermark(canvas, 'VerChem', {
  position: 'bottom-right',
  opacity: 0.3
});
```

### SVGExporter

```tsx
import { SVGExporter } from '@/lib/export/svg-export';

// Convert element to SVG
const svgString = await SVGExporter.elementToSVG(element, {
  width: 800,
  height: 600,
  includeStyles: true
});

// Convert to blob
const blob = await SVGExporter.svgToBlob(svgString);

// Add watermark
const watermarkedSVG = await SVGExporter.addSVGWatermark(svgString, 'VerChem');
```

### PDFExporter

```tsx
import { PDFExporter } from '@/lib/export/pdf-export';

// Create multi-page PDF
const blob = await PDFExporter.createPDF(pages, {
  orientation: 'portrait',
  format: 'a4',
  title: 'My Report',
  author: 'VerChem'
});

// Create report
const blob = await PDFExporter.createReportPDF(title, sections, options);
```

## Quality Settings

| Quality | DPI | Scale | Use Case |
|---------|-----|-------|----------|
| Low | 72 | 1x | Web thumbnails |
| Medium | 150 | 2x | Standard documents |
| High | 300 | 3x | Print quality |
| Ultra | 600 | 4x | Publication quality |

## Examples

### Export 3D Molecular Structure

```tsx
const canvas = document.getElementById('3d-canvas') as HTMLCanvasElement;
await ExportManager.export3DStructure(canvas, {
  format: 'svg',
  filename: 'molecule_3d',
  quality: 'high'
});
```

### Export Calculator Results

```tsx
const results = [
  { name: 'Molar Mass', value: '18.015', unit: 'g/mol', formula: 'H₂O' },
  { name: 'Density', value: '1.000', unit: 'g/cm³' }
];

await ExportManager.exportCalculatorResults(results, 'Water Properties');
```

### Batch Export Multiple Elements

```tsx
await ExportManager.batchExport({
  elements: [
    { element: element1, filename: 'chart1' },
    { element: element2, filename: 'chart2' },
    { element: element3, filename: 'chart3' }
  ],
  format: 'png',
  quality: 'high'
});
```

### Create Scientific Report

```tsx
const sections = [
  {
    title: 'Experimental Data',
    content: document.getElementById('data-section'),
    type: 'html'
  },
  {
    title: 'Results Summary',
    content: 'Calculated molar mass: 180.15 g/mol',
    type: 'text'
  }
];

await ExportManager.exportReport('Lab Report', sections, {
  title: 'Chemistry Lab Report',
  author: 'Student Name'
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Tips

1. **Use appropriate quality**: Higher quality means larger file sizes
2. **Batch operations**: Use batch export for multiple files
3. **Preview first**: Use preview to check before exporting
4. **Optimize images**: Consider JPEG for photos, PNG for graphics
5. **SVG for scalability**: Use SVG for vector graphics and text

## Troubleshooting

### Common Issues

1. **Export fails**: Check element visibility and dimensions
2. **Poor quality**: Increase scale factor or quality setting
3. **Large file sizes**: Use JPEG or reduce quality
4. **Print issues**: Use PrintLayout component
5. **SVG issues**: Ensure proper styling and fonts

### Debug Mode

Enable debug logging:

```tsx
await ExportManager.exportElement(element, {
  format: 'png',
  quality: 'high',
  // Add custom options
  scale: 3,
  backgroundColor: '#ffffff'
});
```

## Integration Examples

The export system is designed to integrate seamlessly with existing VerChem components:

- **Calculators**: Add export buttons to result sections
- **3D Viewer**: Export molecular structures
- **Periodic Table**: Export entire table or selections
- **Graphs**: Export charts and plots
- **Reports**: Generate complete documents

## License

Part of the VerChem project. See main project license for details.