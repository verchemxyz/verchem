// Main export manager
export { ExportManager } from './export-manager';
export type {
  ExportOptions,
  BatchExportOptions,
  ExportFormat,
  ExportQuality,
  CalculatorResult,
  ReportSection,
} from './export-manager';

// Canvas export utilities
export { CanvasExporter } from './canvas-export';
export type { CanvasExportOptions } from './canvas-export';

// SVG export utilities
export { SVGExporter } from './svg-export';
export type { SVGExportOptions } from './svg-export';

// PDF export utilities
export { PDFExporter } from './pdf-export';
export type { PDFExportOptions, PDFPage } from './pdf-export';

// Import the ExportManager class
import { ExportManager as EM } from './export-manager';
import type { ExportOptions, BatchExportOptions, CalculatorResult, ReportSection } from './export-manager';
import type { PDFExportOptions } from './pdf-export';

// Convenience functions for common export tasks
export const exportElement = (element: HTMLElement, options: ExportOptions) => 
  EM.exportElement(element, options);

export const export3DStructure = (canvas: HTMLCanvasElement, options: ExportOptions) => 
  EM.export3DStructure(canvas, options);

export const exportPeriodicTable = (element: HTMLElement, options: ExportOptions) => 
  EM.exportPeriodicTable(element, options);

export const exportCalculatorResults = (
  results: CalculatorResult[],
  calculatorName: string,
  options?: ExportOptions
) => 
  EM.exportCalculatorResults(results, calculatorName, options);

export const exportReport = (
  title: string,
  sections: ReportSection[],
  options?: PDFExportOptions
) => 
  EM.exportReport(title, sections, options);

export const batchExport = (options: BatchExportOptions) => 
  EM.batchExport(options);

export const getSupportedFormats = () => EM.getSupportedFormats();
export const getQualitySettings = () => EM.getQualitySettings();
