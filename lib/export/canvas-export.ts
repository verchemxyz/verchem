import html2canvas from 'html2canvas';

export interface CanvasExportOptions {
  scale?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
}

export class CanvasExporter {
  private static defaultOptions: CanvasExportOptions = {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false
  };

  static async elementToCanvas(
    element: HTMLElement,
    options: CanvasExportOptions = {}
  ): Promise<HTMLCanvasElement> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      const canvas = await html2canvas(element, {
        scale: mergedOptions.scale,
        backgroundColor: mergedOptions.backgroundColor,
        useCORS: mergedOptions.useCORS,
        allowTaint: mergedOptions.allowTaint,
        width: mergedOptions.width,
        height: mergedOptions.height,
        logging: false,
        imageTimeout: 30000,
        removeContainer: true
      });
      
      return canvas;
    } catch (error) {
      console.error('Canvas export failed:', error);
      throw new Error(`Failed to convert element to canvas: ${error}`);
    }
  }

  static async elementToPNG(
    element: HTMLElement,
    options: CanvasExportOptions = {}
  ): Promise<Blob> {
    const canvas = await this.elementToCanvas(element, options);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  static async elementToJPEG(
    element: HTMLElement,
    options: CanvasExportOptions = {}
  ): Promise<Blob> {
    const canvas = await this.elementToCanvas(element, options);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create JPEG blob'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  }

  static async canvasToDataURL(
    canvas: HTMLCanvasElement,
    format: 'png' | 'jpeg' = 'png',
    quality: number = 1.0
  ): Promise<string> {
    return canvas.toDataURL(`image/${format}`, quality);
  }

  static createHighResCanvas(
    originalCanvas: HTMLCanvasElement,
    scale: number = 3
  ): HTMLCanvasElement {
    const highResCanvas = document.createElement('canvas');
    const ctx = highResCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    highResCanvas.width = originalCanvas.width * scale;
    highResCanvas.height = originalCanvas.height * scale;
    
    ctx.scale(scale, scale);
    ctx.drawImage(originalCanvas, 0, 0);
    
    return highResCanvas;
  }

  static async addWatermark(
    canvas: HTMLCanvasElement,
    watermarkText: string,
    options: {
      font?: string;
      color?: string;
      opacity?: number;
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
      margin?: number;
    } = {}
  ): Promise<HTMLCanvasElement> {
    const {
      font = '16px Arial',
      color = 'rgba(0, 0, 0, 0.5)',
      opacity = 0.5,
      position = 'bottom-right',
      margin = 20
    } = options;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = font;
    ctx.fillStyle = color;

    const textMetrics = ctx.measureText(watermarkText);
    const textWidth = textMetrics.width;
    const textHeight = parseInt(font.match(/\d+/)?.[0] || '16', 10);

    let x: number, y: number;
    
    switch (position) {
      case 'bottom-left':
        x = margin;
        y = canvas.height - margin;
        break;
      case 'top-right':
        x = canvas.width - textWidth - margin;
        y = margin + textHeight;
        break;
      case 'top-left':
        x = margin;
        y = margin + textHeight;
        break;
      default: // bottom-right
        x = canvas.width - textWidth - margin;
        y = canvas.height - margin;
    }

    ctx.fillText(watermarkText, x, y);
    ctx.restore();

    return canvas;
  }
}