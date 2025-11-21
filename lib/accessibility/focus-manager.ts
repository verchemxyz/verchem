import React from 'react';

export interface FocusManagerOptions {
  trapFocus?: boolean;
  returnFocus?: boolean;
  initialFocus?: HTMLElement | string;
  fallbackFocus?: HTMLElement | string;
}

export class FocusManager {
  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private options: FocusManagerOptions;
  private container: HTMLElement;
  private keydownHandler: (event: KeyboardEvent) => void;
  
  constructor(container: HTMLElement, options: FocusManagerOptions = {}) {
    this.container = container;
    this.options = {
      trapFocus: true,
      returnFocus: true,
      ...options
    };
    this.keydownHandler = this.trapFocus.bind(this);
  }
  
  // Get all focusable elements within the container
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
      'details summary'
    ].join(', ');
    
    const elements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
    
    // Filter out invisible elements and sort by tabIndex
    return elements
      .filter(el => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0
        );
      })
      .sort((a, b) => {
        const aTabIndex = parseInt(a.getAttribute('tabindex') || '0');
        const bTabIndex = parseInt(b.getAttribute('tabindex') || '0');
        return aTabIndex - bTabIndex;
      });
  }
  
  // Trap focus within the container
  private trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    
    const currentFocus = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.indexOf(currentFocus);
    
    if (currentIndex === -1) {
      // If current focus is not in our list, focus the first element
      this.focusableElements[0]?.focus();
      event.preventDefault();
      return;
    }
    
    let nextIndex: number;
    if (event.shiftKey) {
      // Shift + Tab (backward)
      nextIndex = currentIndex > 0 ? currentIndex - 1 : this.focusableElements.length - 1;
    } else {
      // Tab (forward)
      nextIndex = currentIndex < this.focusableElements.length - 1 ? currentIndex + 1 : 0;
    }
    
    this.focusableElements[nextIndex]?.focus();
    event.preventDefault();
  }
  
  // Set initial focus
  private setInitialFocus(): void {
    let elementToFocus: HTMLElement | null = null;
    
    if (this.options.initialFocus) {
      if (typeof this.options.initialFocus === 'string') {
        elementToFocus = this.container.querySelector(this.options.initialFocus) as HTMLElement;
      } else {
        elementToFocus = this.options.initialFocus;
      }
    }
    
    if (!elementToFocus && this.focusableElements.length > 0) {
      // Try to find the first non-disabled, visible element
      elementToFocus = this.focusableElements[0];
    }
    
    if (!elementToFocus && this.options.fallbackFocus) {
      if (typeof this.options.fallbackFocus === 'string') {
        elementToFocus = this.container.querySelector(this.options.fallbackFocus) as HTMLElement;
      } else {
        elementToFocus = this.options.fallbackFocus;
      }
    }
    
    elementToFocus?.focus();
  }
  
  // Activate focus management
  activate(): void {
    // Store the currently focused element
    this.previousActiveElement = document.activeElement as HTMLElement;
    
    // Get focusable elements
    this.focusableElements = this.getFocusableElements();
    
    // Set up focus trap if enabled
    if (this.options.trapFocus) {
      this.container.addEventListener('keydown', this.keydownHandler);
    }
    
    // Set initial focus
    this.setInitialFocus();
    
    // Add focus management attributes
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-label', 'Modal dialog');
    this.container.setAttribute('tabindex', '-1');
  }
  
  // Deactivate focus management
  deactivate(): void {
    // Remove focus trap
    if (this.options.trapFocus) {
      this.container.removeEventListener('keydown', this.keydownHandler);
    }
    
    // Return focus to the previously focused element
    if (this.options.returnFocus && this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
    
    // Remove focus management attributes
    this.container.removeAttribute('role');
    this.container.removeAttribute('aria-label');
    this.container.removeAttribute('tabindex');
    
    // Clear references
    this.focusableElements = [];
    this.previousActiveElement = null;
  }
  
  // Update focusable elements (useful if DOM changes)
  updateFocusableElements(): void {
    this.focusableElements = this.getFocusableElements();
  }
  
  // Get current focusable elements
  getCurrentFocusableElements(): HTMLElement[] {
    return this.focusableElements;
  }
}

// Hook for managing focus in React components
export function useFocusManager(
  ref: React.RefObject<HTMLElement>, 
  options: FocusManagerOptions = {}
) {
  const focusManagerRef = React.useRef<FocusManager | null>(null);
  
  React.useEffect(() => {
    if (!ref.current) return;
    
    focusManagerRef.current = new FocusManager(ref.current, options);
    
    return () => {
      focusManagerRef.current?.deactivate();
    };
  }, [ref, options]);
  
  const activateFocus = React.useCallback(() => {
    focusManagerRef.current?.activate();
  }, []);
  
  const deactivateFocus = React.useCallback(() => {
    focusManagerRef.current?.deactivate();
  }, []);
  
  const updateFocusableElements = React.useCallback(() => {
    focusManagerRef.current?.updateFocusableElements();
  }, []);
  
  return {
    activateFocus,
    deactivateFocus,
    updateFocusableElements,
  };
}

// Utility function to create focusable elements
export function makeElementFocusable(
  element: HTMLElement, 
  options: {
    tabIndex?: number;
    role?: string;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
  } = {}
): void {
  if (options.tabIndex !== undefined) {
    element.setAttribute('tabindex', options.tabIndex.toString());
  }
  
  if (options.role) {
    element.setAttribute('role', options.role);
  }
  
  if (options.ariaLabel) {
    element.setAttribute('aria-label', options.ariaLabel);
  }
  
  if (options.ariaLabelledBy) {
    element.setAttribute('aria-labelledby', options.ariaLabelledBy);
  }
  
  if (options.ariaDescribedBy) {
    element.setAttribute('aria-describedby', options.ariaDescribedBy);
  }
}

// Utility function to create skip links
export function createSkipLink(targetId: string, linkText: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = linkText;
  link.className = 'skip-link';
  link.setAttribute('tabindex', '0');
  
  // Style the skip link
  Object.assign(link.style, {
    position: 'absolute',
    top: '-40px',
    left: '6px',
    background: '#000',
    color: '#fff',
    padding: '8px',
    textDecoration: 'none',
    borderRadius: '4px',
    transition: 'top 0.3s',
    zIndex: '1000'
  });
  
  // Show on focus
  link.addEventListener('focus', () => {
    link.style.top = '6px';
  });
  
  link.addEventListener('blur', () => {
    link.style.top = '-40px';
  });
  
  return link;
}
