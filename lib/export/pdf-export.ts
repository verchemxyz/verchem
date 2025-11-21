import jsPDF from 'jspdf';
import { CanvasExporter } from './canvas-export';
import { SVGExporter } from './svg-export';

export interface PDFExportOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  format?: string | [number, number];
  compress?: boolean;
  title?: string;
  subject?: string;
  author?: string;
  keywords?: string;
  creator?: string;
  margin?: number;
  header?: string;
  footer?: string;
  pageNumbers?: boolean;
  watermark?: string;
}

export interface PDFPage {
  type: 'canvas' | 'svg' | 'text' | 'html';
  content: string | HTMLCanvasElement | HTMLElement;
  title?: string;
  width?: number;
  height?: number;
}

export class PDFExporter {
  private static defaultOptions: PDFExportOptions = {
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
    margin: 50,
    pageNumbers: true
  };

  static async createPDF(
    pages: PDFPage[],
    options: PDFExportOptions = {}
  ): Promise<Blob> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      const pdf = new jsPDF({
        orientation: mergedOptions.orientation,
        unit: mergedOptions.unit,
        format: mergedOptions.format,
        compress: mergedOptions.compress
      });

      // Set document properties
      if (mergedOptions.title) pdf.setProperties({ title: mergedOptions.title });
      if (mergedOptions.subject) pdf.setProperties({ subject: mergedOptions.subject });
      if (mergedOptions.author) pdf.setProperties({ author: mergedOptions.author });
      if (mergedOptions.keywords) pdf.setProperties({ keywords: mergedOptions.keywords });
      if (mergedOptions.creator) pdf.setProperties({ creator: mergedOptions.creator });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        if (i > 0) {
          pdf.addPage();
        }

        await this.addPageToPDF(pdf, page, mergedOptions);
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error(`Failed to create PDF: ${error}`);
    }
  }

  private static async addPageToPDF(
    pdf: jsPDF,
    page: PDFPage,
    options: PDFExportOptions
  ): Promise<void> {
    const margin = options.margin || 50;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;

    // Add header
    if (options.header) {
      pdf.setFontSize(12);
      pdf.text(options.header, margin, margin - 20);
    }

    // Add page title
    if (page.title) {
      pdf.setFontSize(16);
      pdf.text(page.title, margin, margin + 10);
    }

    // Add content based on type
    switch (page.type) {
      case 'canvas':
        await this.addCanvasToPDF(pdf, page.content as HTMLCanvasElement, {
          x: margin,
          y: margin + (page.title ? 30 : 0),
          width: contentWidth,
          height: contentHeight - (page.title ? 30 : 0)
        });
        break;

      case 'svg':
        await this.addSVGToPDF(pdf, page.content as string, {
          x: margin,
          y: margin + (page.title ? 30 : 0),
          width: contentWidth,
          height: contentHeight - (page.title ? 30 : 0)
        });
        break;

      case 'text':
        this.addTextToPDF(pdf, page.content as string, {
          x: margin,
          y: margin + (page.title ? 30 : 0),
          width: contentWidth,
          height: contentHeight - (page.title ? 30 : 0)
        });
        break;

      case 'html':
        await this.addHTMLToPDF(pdf, page.content as HTMLElement, {
          x: margin,
          y: margin + (page.title ? 30 : 0),
          width: contentWidth,
          height: contentHeight - (page.title ? 30 : 0)
        });
        break;
    }

    // Add footer
    if (options.footer || options.pageNumbers) {
      const footerY = pageHeight - margin + 20;
      
      if (options.footer) {
        pdf.setFontSize(10);
        pdf.text(options.footer, margin, footerY);
      }
      
      if (options.pageNumbers) {
        const pageNumber = pdf.getNumberOfPages();
        pdf.setFontSize(10);
        pdf.text(`${pageNumber}`, pageWidth / 2, footerY, { align: 'center' });
      }
    }

    // Add watermark
    if (options.watermark) {
      this.addWatermarkToPDF(pdf, options.watermark);
    }
  }

  private static async addCanvasToPDF(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    const dataURL = canvas.toDataURL('image/png');
    const aspectRatio = canvas.width / canvas.height;
    
    let { width, height } = position;
    
    // Maintain aspect ratio
    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }

    pdf.addImage(dataURL, 'PNG', position.x, position.y, width, height);
  }

  private static async addSVGToPDF(
    pdf: jsPDF,
    svgString: string,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    try {
      // Convert SVG to canvas first, then to PDF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          this.addCanvasToPDF(pdf, canvas, position).then(() => {
            URL.revokeObjectURL(url);
            resolve();
          }).catch(reject);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG image'));
        };
        
        img.src = url;
      });
    } catch (error) {
      console.error('SVG to PDF conversion failed:', error);
      // Fallback: convert SVG to data URL and add as image
      const dataURL = await SVGExporter.svgToDataURL(svgString);
      pdf.addImage(dataURL, 'SVG', position.x, position.y, position.width, position.height);
    }
  }

  private static addTextToPDF(
    pdf: jsPDF,
    text: string,
    position: { x: number; y: number; width: number; height: number }
  ): void {
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(text, position.width);
    pdf.text(lines, position.x, position.y);
  }

  private static async addHTMLToPDF(
    pdf: jsPDF,
    element: HTMLElement,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    const canvas = await CanvasExporter.elementToCanvas(element, {
      width: position.width,
      height: position.height,
      scale: 2
    });
    
    await this.addCanvasToPDF(pdf, canvas, position);
  }

  private static addWatermarkToPDF(pdf: jsPDF, watermark: string): void {
    if (!watermark) return;
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFontSize(50);
    pdf.setTextColor(200, 200, 200);
    pdf.setFont('helvetica', 'normal');
    
    // Add watermark diagonally across the page
    const angle = -45 * (Math.PI / 180);
    const x = pageWidth / 2;
    const y = pageHeight / 2;
    
    pdf.text(watermark, x, y, { 
      angle, 
      align: 'center',
      baseline: 'middle'
    });
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  static async createReportPDF(
    title: string,
    sections: Array<{
      title: string;
      content: string | HTMLElement | HTMLCanvasElement;
      type: 'text' | 'html' | 'canvas';
    }>,
    options: PDFExportOptions = {}
  ): Promise<Blob> {
    const pages: PDFPage[] = sections.map(section => ({
      type: section.type,
      content: section.content,
      title: section.title
    }));

    return this.createPDF(pages, {
      ...options,
      title: title,
      header: 'VerChem - Chemistry Tools',
      footer: 'Generated by VerChem',
      watermark: options.watermark || ''
    });
  }

  static async exportElementToPDF(
    element: HTMLElement,
    filename: string,
    options: PDFExportOptions = {}
  ): Promise<void> {
    const pages: PDFPage[] = [{
      type: 'html',
      content: element,
      title: options.title || 'Export'
    }];

    const blob = await this.createPDF(pages, options);
    this.downloadBlob(blob, filename);
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
