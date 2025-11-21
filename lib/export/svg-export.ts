export interface SVGExportOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  title?: string;
  includeStyles?: boolean;
  optimize?: boolean;
}

export class SVGExporter {
  private static defaultOptions: SVGExportOptions = {
    includeStyles: true,
    optimize: true,
    backgroundColor: 'transparent'
  };

  static async elementToSVG(
    element: HTMLElement,
    options: SVGExportOptions = {}
  ): Promise<string> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Clone the element
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Create SVG wrapper
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      
      // Set dimensions
      const rect = element.getBoundingClientRect();
      const width = mergedOptions.width || rect.width;
      const height = mergedOptions.height || rect.height;
      
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      
      if (mergedOptions.title) {
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = mergedOptions.title;
        svg.appendChild(title);
      }
      
      // Set background if specified
      if (mergedOptions.backgroundColor && mergedOptions.backgroundColor !== 'transparent') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', mergedOptions.backgroundColor);
        svg.appendChild(rect);
      }
      
      foreignObject.setAttribute('width', '100%');
      foreignObject.setAttribute('height', '100%');
      foreignObject.setAttribute('x', '0');
      foreignObject.setAttribute('y', '0');
      
      // Add styles if requested
      if (mergedOptions.includeStyles) {
        const styles = this.extractElementStyles(element);
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        foreignObject.appendChild(styleElement);
      }
      
      foreignObject.appendChild(clone);
      svg.appendChild(foreignObject);
      
      // Serialize to string
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svg);
      
      // Optimize if requested
      if (mergedOptions.optimize) {
        svgString = this.optimizeSVG(svgString);
      }
      
      return svgString;
    } catch (error) {
      console.error('SVG export failed:', error);
      throw new Error(`Failed to convert element to SVG: ${error}`);
    }
  }

  static async svgToDataURL(svgString: string): Promise<string> {
    const encoded = encodeURIComponent(svgString);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }

  static async svgToBlob(svgString: string): Promise<Blob> {
    const dataURL = await this.svgToDataURL(svgString);
    const response = await fetch(dataURL);
    return response.blob();
  }

  static async canvasToSVG(
    canvas: HTMLCanvasElement,
    options: SVGExportOptions = {}
  ): Promise<string> {
    const dataURL = canvas.toDataURL('image/png');
    const width = options.width || canvas.width;
    const height = options.height || canvas.height;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    if (options.title) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = options.title;
      svg.appendChild(title);
    }
    
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('width', width.toString());
    image.setAttribute('height', height.toString());
    image.setAttribute('href', dataURL);
    
    svg.appendChild(image);
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  }

  private static extractElementStyles(element: HTMLElement): string {
    const styles = new Set<string>();
    
    // Get computed styles for the element
    const computedStyle = window.getComputedStyle(element);
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      const value = computedStyle.getPropertyValue(property);
      if (value && value !== 'initial' && value !== 'inherit') {
        styles.add(`${property}: ${value};`);
      }
    }
    
    // Get styles from all children
    const allElements = element.querySelectorAll('*');
    allElements.forEach((el) => {
      const childStyle = window.getComputedStyle(el as HTMLElement);
      for (let i = 0; i < childStyle.length; i++) {
        const property = childStyle[i];
        const value = childStyle.getPropertyValue(property);
        if (value && value !== 'initial' && value !== 'inherit') {
          styles.add(`${property}: ${value};`);
        }
      }
    });
    
    return Array.from(styles).join('\n');
  }

  private static optimizeSVG(svgString: string): string {
    // Basic SVG optimization
    return svgString
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s*=\s*"/g, '="')
      .trim();
  }

  static async addSVGWatermark(
    svgString: string,
    watermarkText: string,
    options: {
      fontSize?: number;
      color?: string;
      opacity?: number;
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
      margin?: number;
    } = {}
  ): Promise<string> {
    const {
      fontSize = 16,
      color = 'rgba(0, 0, 0, 0.5)',
      opacity = 0.5,
      position = 'bottom-right',
      margin = 20
    } = options;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    
    if (!svg) return svgString;

    const width = parseInt(svg.getAttribute('width') || '100', 10);
    const height = parseInt(svg.getAttribute('height') || '100', 10);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('font-size', fontSize.toString());
    text.setAttribute('fill', color);
    text.setAttribute('opacity', opacity.toString());
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.textContent = watermarkText;

    let x: number, y: number;
    const textWidth = watermarkText.length * fontSize * 0.6; // Approximate width
    
    switch (position) {
      case 'bottom-left':
        x = margin;
        y = height - margin;
        break;
      case 'top-right':
        x = width - textWidth - margin;
        y = margin + fontSize;
        break;
      case 'top-left':
        x = margin;
        y = margin + fontSize;
        break;
      default: // bottom-right
        x = width - textWidth - margin;
        y = height - margin;
    }

    text.setAttribute('x', x.toString());
    text.setAttribute('y', y.toString());

    svg.appendChild(text);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  }
}