import { saveAs } from 'file-saver';
import { CanvasExporter } from './canvas-export';
import { SVGExporter } from './svg-export';
import { PDFExporter, PDFExportOptions } from './pdf-export';

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface ExportOptions {
  format: ExportFormat;
  quality?: ExportQuality;
  filename?: string;
  includeTimestamp?: boolean;
  addWatermark?: boolean;
  watermarkText?: string;
  dpi?: number;
  scale?: number;
}

export interface BatchExportOptions extends ExportOptions {
  elements: Array<{
    element: HTMLElement;
    filename?: string;
    title?: string;
  }>;
}

export interface CalculatorResult {
  name: string;
  value: string;
  unit?: string;
  formula?: string;
}

export interface ReportSection {
  title: string;
  content: string | HTMLElement | HTMLCanvasElement;
  type: 'text' | 'html' | 'canvas';
}

export class ExportManager {
  private static qualitySettings = {
    low: { scale: 1, dpi: 72 },
    medium: { scale: 2, dpi: 150 },
    high: { scale: 3, dpi: 300 },
    ultra: { scale: 4, dpi: 600 }
  };

  static async exportElement(
    element: HTMLElement,
    options: ExportOptions
  ): Promise<void> {
    if (!options.format) {
      throw new Error('Export format is required');
    }

    const {
      format,
      quality = 'high',
      filename = 'export',
      includeTimestamp = true,
      addWatermark = false,
      watermarkText = 'VerChem'
    } = options;

    const qualitySettings = this.qualitySettings[quality];
    const finalFilename = this.generateFilename(filename, format, includeTimestamp);

    try {
      let blob: Blob;

      switch (format) {
        case 'png':
          blob = await this.exportToPNG(element, {
            ...options,
            format,
            quality,
            filename,
            includeTimestamp,
            scale: options.scale || qualitySettings.scale,
            addWatermark,
            watermarkText
          });
          break;

        case 'jpeg':
          blob = await this.exportToJPEG(element, {
            ...options,
            format,
            quality,
            filename,
            includeTimestamp,
            scale: options.scale || qualitySettings.scale,
            addWatermark,
            watermarkText
          });
          break;

        case 'svg':
          blob = await this.exportToSVG(element, {
            ...options,
            format,
            quality,
            filename,
            includeTimestamp,
            addWatermark,
            watermarkText
          });
          break;

        case 'pdf':
          await this.exportToPDF(element, finalFilename, options);
          return; // PDF export handles its own download

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      saveAs(blob, finalFilename);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Export failed: ${error}`);
    }
  }

  private static async exportToPNG(
    element: HTMLElement,
    options: ExportOptions & { addWatermark: boolean; watermarkText: string }
  ): Promise<Blob> {
    let blob = await CanvasExporter.elementToPNG(element, {
      scale: options.scale,
      backgroundColor: '#ffffff'
    });

    if (options.addWatermark) {
      const canvas = await CanvasExporter.elementToCanvas(element, {
        scale: options.scale,
        backgroundColor: '#ffffff'
      });
      
      const watermarkedCanvas = await CanvasExporter.addWatermark(canvas, options.watermarkText, {
        opacity: 0.3,
        position: 'bottom-right'
      });

      blob = await new Promise<Blob>((resolve, reject) => {
        watermarkedCanvas.toBlob((newBlob) => {
          if (newBlob) resolve(newBlob);
          else reject(new Error('Failed to create watermarked PNG'));
        }, 'image/png', 1.0);
      });
    }

    return blob;
  }

  private static async exportToJPEG(
    element: HTMLElement,
    options: ExportOptions & { addWatermark: boolean; watermarkText: string }
  ): Promise<Blob> {
    let blob = await CanvasExporter.elementToJPEG(element, {
      scale: options.scale,
      backgroundColor: '#ffffff'
    });

    if (options.addWatermark) {
      const canvas = await CanvasExporter.elementToCanvas(element, {
        scale: options.scale,
        backgroundColor: '#ffffff'
      });
      
      const watermarkedCanvas = await CanvasExporter.addWatermark(canvas, options.watermarkText, {
        opacity: 0.3,
        position: 'bottom-right',
        color: 'rgba(255, 255, 255, 0.7)'
      });

      blob = await new Promise<Blob>((resolve, reject) => {
        watermarkedCanvas.toBlob((newBlob) => {
          if (newBlob) resolve(newBlob);
          else reject(new Error('Failed to create watermarked JPEG'));
        }, 'image/jpeg', 0.95);
      });
    }

    return blob;
  }

  private static async exportToSVG(
    element: HTMLElement,
    options: ExportOptions & { addWatermark: boolean; watermarkText: string }
  ): Promise<Blob> {
    let svgString = await SVGExporter.elementToSVG(element);

    if (options.addWatermark) {
      svgString = await SVGExporter.addSVGWatermark(svgString, options.watermarkText, {
        opacity: 0.3,
        position: 'bottom-right'
      });
    }

    return SVGExporter.svgToBlob(svgString);
  }

  private static async exportToPDF(
    element: HTMLElement,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    await PDFExporter.exportElementToPDF(element, filename, {
      ...options,
      title: options.filename || 'Export',
      orientation: 'portrait',
      format: 'a4'
    });
  }

  static async batchExport(options: BatchExportOptions): Promise<void> {
    const { elements, format } = options;

    for (let i = 0; i < elements.length; i++) {
      const { element, filename } = elements[i];
      const finalFilename = filename || this.generateFilename(`export_${i + 1}`, options.format, true);

      try {
        await this.exportElement(element, {
          ...options,
          filename: finalFilename,
          format
        });
      } catch (error) {
        console.error(`Failed to export ${finalFilename}:`, error);
        // Continue with other exports even if one fails
      }
    }
  }

  static async exportReport(
    title: string,
    sections: ReportSection[],
    options: PDFExportOptions = {}
  ): Promise<void> {
    const filename = this.generateFilename(title.replace(/\s+/g, '_'), 'pdf', true);
    
    const blob = await PDFExporter.createReportPDF(title, sections, {
      ...options,
      title,
      author: 'VerChem',
      creator: 'VerChem Export System'
    });

    saveAs(blob, filename);
  }

  static async export3DStructure(
    canvas: HTMLCanvasElement,
    options: ExportOptions
  ): Promise<void> {
    const filename = options.filename || 'molecular_structure';
    
    if (options.format === 'svg') {
      // For 3D structures, convert canvas to SVG first
      const svgString = await SVGExporter.canvasToSVG(canvas, {
        title: 'Molecular Structure',
        width: canvas.width,
        height: canvas.height
      });
      
      const blob = await SVGExporter.svgToBlob(svgString);
      const finalFilename = this.generateFilename(filename, 'svg', options.includeTimestamp || false);
      saveAs(blob, finalFilename);
    } else {
      // For raster formats, use canvas directly
      const finalFilename = this.generateFilename(
        filename,
        options.format || 'png',
        options.includeTimestamp || false
      );
      
      if (options.format === 'pdf') {
        await PDFExporter.exportElementToPDF(canvas, finalFilename, {
          title: 'Molecular Structure',
          ...options
        });
      } else {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob from canvas'));
          }, `image/${options.format}`, 1.0);
        });
        
        saveAs(blob, finalFilename);
      }
    }
  }

  static async exportPeriodicTable(
    element: HTMLElement,
    options: ExportOptions
  ): Promise<void> {
    const filename = options.filename || 'periodic_table';
    
    // Periodic table benefits from high resolution
    const highQualityOptions = {
      ...options,
      quality: 'ultra' as ExportQuality,
      scale: 4
    };

    await this.exportElement(element, {
      ...highQualityOptions,
      filename
    });
  }

  static async exportCalculatorResults(
    results: CalculatorResult[],
    calculatorName: string,
    options: ExportOptions = { format: 'pdf' }
  ): Promise<void> {
    const sections = [
      {
        title: `${calculatorName} Results`,
        content: this.formatCalculatorResults(results),
        type: 'text' as const
      }
    ];

    await this.exportReport(`${calculatorName}_Results`, sections, {
      title: `${calculatorName} Calculation Results`,
      ...options,
      format: 'pdf'
    });
  }

  private static formatCalculatorResults(
    results: CalculatorResult[]
  ): string {
    return results.map(result => {
      let line = `${result.name}: ${result.value}`;
      if (result.unit) line += ` ${result.unit}`;
      if (result.formula) line += `\n  Formula: ${result.formula}`;
      return line;
    }).join('\n\n');
  }

  private static generateFilename(
    baseName: string,
    format: ExportFormat,
    includeTimestamp: boolean
  ): string {
    let filename = baseName;
    
    if (includeTimestamp) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename += `_${timestamp}`;
    }
    
    filename += `.${format}`;
    return filename;
  }

  static getSupportedFormats(): ExportFormat[] {
    return ['png', 'jpeg', 'svg', 'pdf'];
  }

  static getQualitySettings(): Record<ExportQuality, string> {
    return {
      low: 'Low quality (72 DPI)',
      medium: 'Medium quality (150 DPI)',
      high: 'High quality (300 DPI)',
      ultra: 'Ultra high quality (600 DPI)'
    };
  }
}
