import { useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from './context';
import { createElementLabel, createElementDescription } from './aria-labels';
import { ShortcutCategory } from './keyboard-shortcuts';

interface AccessibilityFeaturesOptions {
  announceOnMount?: boolean;
  announceMessage?: string;
  context?: string;
  keyboardShortcuts?: Array<{
    key: string;
    handler: () => void;
    description: string;
    global?: boolean;
  }>;
}

export function useAccessibilityFeatures(
  elementRef: React.RefObject<HTMLElement>,
  options: AccessibilityFeaturesOptions = {}
) {
  const {
    announceToScreenReader,
    registerShortcut,
    unregisterShortcut,
    setCurrentContext,
    currentContext
  } = useAccessibility();
  
  const shortcutsRef = useRef<Map<string, () => void>>(new Map());
  
  // Announce component mount
  useEffect(() => {
    if (options.announceOnMount) {
      const message = options.announceMessage || 'Component loaded';
      announceToScreenReader(message);
    }
  }, [options.announceOnMount, options.announceMessage, announceToScreenReader]);
  
  // Set context for keyboard shortcuts
  useEffect(() => {
    if (options.context && options.context !== currentContext) {
      setCurrentContext(options.context);
    }
    
    return () => {
      if (options.context && currentContext === options.context) {
        setCurrentContext('global');
      }
    };
  }, [options.context, currentContext, setCurrentContext]);
  
  // Register keyboard shortcuts
  useEffect(() => {
    const shortcutMap = shortcutsRef.current;

    if (options.keyboardShortcuts) {
      options.keyboardShortcuts.forEach(shortcut => {
        const handler = () => {
          shortcut.handler();
          announceToScreenReader(`${shortcut.description} activated`);
        };
        
        shortcutMap.set(shortcut.key, handler);
        registerShortcut(
          {
            key: shortcut.key,
            description: shortcut.description,
            category: ShortcutCategory.GENERAL,
            global: shortcut.global
          },
          handler
        );
      });
    }
    
    return () => {
      if (options.keyboardShortcuts) {
        options.keyboardShortcuts.forEach(shortcut => {
          const handler = shortcutMap.get(shortcut.key);
          if (handler) {
            unregisterShortcut(shortcut.key);
            shortcutMap.delete(shortcut.key);
          }
        });
      }
    };
  }, [options.keyboardShortcuts, registerShortcut, unregisterShortcut, announceToScreenReader]);
  
  // Add ARIA attributes to element
  const addARIAAttributes = useCallback((
    attributes: {
      role?: string;
      label?: string;
      labelledBy?: string;
      describedBy?: string;
      expanded?: boolean;
      pressed?: boolean;
      selected?: boolean;
      checked?: boolean;
      invalid?: boolean;
      required?: boolean;
      disabled?: boolean;
      hidden?: boolean;
      level?: number;
      valueNow?: number;
      valueMin?: number;
      valueMax?: number;
      valueText?: string;
      live?: 'off' | 'polite' | 'assertive';
      atomic?: boolean;
      relevant?: string;
      busy?: boolean;
    } = {}
  ) => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    
    // Set role
    if (attributes.role) {
      element.setAttribute('role', attributes.role);
    }
    
    // Set ARIA label
    if (attributes.label) {
      element.setAttribute('aria-label', attributes.label);
    }
    
    // Set ARIA labelled by
    if (attributes.labelledBy) {
      element.setAttribute('aria-labelledby', attributes.labelledBy);
    }
    
    // Set ARIA described by
    if (attributes.describedBy) {
      element.setAttribute('aria-describedby', attributes.describedBy);
    }
    
    // Set state attributes
    if (attributes.expanded !== undefined) {
      element.setAttribute('aria-expanded', attributes.expanded.toString());
    }
    
    if (attributes.pressed !== undefined) {
      element.setAttribute('aria-pressed', attributes.pressed.toString());
    }
    
    if (attributes.selected !== undefined) {
      element.setAttribute('aria-selected', attributes.selected.toString());
    }
    
    if (attributes.checked !== undefined) {
      element.setAttribute('aria-checked', attributes.checked.toString());
    }
    
    if (attributes.invalid !== undefined) {
      element.setAttribute('aria-invalid', attributes.invalid.toString());
    }
    
    if (attributes.required !== undefined) {
      element.setAttribute('aria-required', attributes.required.toString());
    }
    
    if (attributes.disabled !== undefined) {
      element.setAttribute('aria-disabled', attributes.disabled.toString());
    }
    
    if (attributes.hidden !== undefined) {
      element.setAttribute('aria-hidden', attributes.hidden.toString());
    }
    
    // Set level attributes
    if (attributes.level !== undefined) {
      element.setAttribute('aria-level', attributes.level.toString());
    }
    
    // Set value attributes
    if (attributes.valueNow !== undefined) {
      element.setAttribute('aria-valuenow', attributes.valueNow.toString());
    }
    
    if (attributes.valueMin !== undefined) {
      element.setAttribute('aria-valuemin', attributes.valueMin.toString());
    }
    
    if (attributes.valueMax !== undefined) {
      element.setAttribute('aria-valuemax', attributes.valueMax.toString());
    }
    
    if (attributes.valueText) {
      element.setAttribute('aria-valuetext', attributes.valueText);
    }
    
    // Set live region attributes
    if (attributes.live) {
      element.setAttribute('aria-live', attributes.live);
    }
    
    if (attributes.atomic !== undefined) {
      element.setAttribute('aria-atomic', attributes.atomic.toString());
    }
    
    if (attributes.relevant) {
      element.setAttribute('aria-relevant', attributes.relevant);
    }
    
    if (attributes.busy !== undefined) {
      element.setAttribute('aria-busy', attributes.busy.toString());
    }
  }, [elementRef]);
  
  // Remove ARIA attributes
  const removeARIAAttributes = useCallback((
    attributes: string[] = []
  ) => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    const defaultAttributes = [
      'role', 'aria-label', 'aria-labelledby', 'aria-describedby',
      'aria-expanded', 'aria-pressed', 'aria-selected', 'aria-checked',
      'aria-invalid', 'aria-required', 'aria-disabled', 'aria-hidden',
      'aria-level', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax',
      'aria-valuetext', 'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy'
    ];
    
    const attributesToRemove = attributes.length > 0 ? attributes : defaultAttributes;
    
    attributesToRemove.forEach(attr => {
      element.removeAttribute(attr);
    });
  }, [elementRef]);
  
  // Announce changes
  const announceChange = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, [announceToScreenReader]);
  
  // Create accessible label
  const createAccessibleLabel = useCallback((
    baseLabel: string,
    options?: {
      index?: number;
      count?: number;
      type?: string;
      properties?: Record<string, unknown>;
    }
  ): string => {
    let label = createElementLabel(baseLabel, options?.index);
    
    if (options?.count !== undefined) {
      label += ` ${options.index! + 1} of ${options.count}`;
    }
    
    if (options?.type) {
      const description = createElementDescription(options.type, options.properties);
      label += `. ${description}`;
    }
    
    return label;
  }, []);
  
  // Handle keyboard navigation
  const handleKeyboardNavigation = useCallback((
    event: KeyboardEvent | React.KeyboardEvent,
    options: {
      onEnter?: () => void;
      onEscape?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
      onTab?: () => void;
      onSpace?: () => void;
      preventDefault?: boolean;
      stopPropagation?: boolean;
    } = {}
  ) => {
    const handlers: Record<string, (() => void) | undefined> = {
      Enter: options.onEnter,
      Escape: options.onEscape,
      ArrowUp: options.onArrowUp,
      ArrowDown: options.onArrowDown,
      ArrowLeft: options.onArrowLeft,
      ArrowRight: options.onArrowRight,
      Tab: options.onTab,
      ' ': options.onSpace
    };
    
    const handler = handlers[event.key];
    if (handler) {
      if (options.preventDefault) {
        event.preventDefault();
      }
      if (options.stopPropagation) {
        event.stopPropagation();
      }
      handler();
    }
  }, []);
  
  // Validate accessibility
  const validateAccessibility = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!elementRef.current) {
      errors.push('Element reference is not available');
      return errors;
    }
    
    const element = elementRef.current;
    
    // Check for proper labeling
    const hasLabel = element.hasAttribute('aria-label') || 
                    element.hasAttribute('aria-labelledby') ||
                    ((element as HTMLInputElement).labels && (element as HTMLInputElement).labels!.length > 0);
    
    if (!hasLabel && ['button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
      errors.push('Interactive element missing accessible label');
    }
    
    // Check for proper role
    const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
    if (interactiveElements.includes(element.tagName.toLowerCase()) && !element.hasAttribute('role')) {
      // This is fine - native elements have implicit roles
    }
    
    // Check for focusability
    if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') === '-1') {
      // Element is intentionally not focusable
    } else if (!element.matches('button, a, input, select, textarea, [tabindex]')) {
      errors.push('Element may not be keyboard accessible');
    }
    
    // Check for color contrast (basic check)
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;
    
    if (backgroundColor === 'rgba(0, 0, 0, 0)' && color === 'rgb(0, 0, 0)') {
      // This might have contrast issues depending on parent background
      errors.push('Element may have insufficient color contrast');
    }
    
    return errors;
  }, [elementRef]);
  
  return {
    addARIAAttributes,
    removeARIAAttributes,
    announceChange,
    createAccessibleLabel,
    handleKeyboardNavigation,
    validateAccessibility
  };
}

// Hook for managing live regions
export function useLiveRegion(
  priority: 'polite' | 'assertive' = 'polite'
) {
  const { announceToScreenReader } = useAccessibility();
  
  const announce = useCallback((message: string) => {
    announceToScreenReader(message, priority);
  }, [announceToScreenReader, priority]);
  
  return { announce };
}

// Hook for managing focus
export function useFocusManagement() {
  const focusElement = useCallback((element: HTMLElement | string) => {
    let target: HTMLElement | null;
    
    if (typeof element === 'string') {
      target = document.getElementById(element);
    } else {
      target = element;
    }
    
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      
      // Remove tabindex after focus
      setTimeout(() => {
        target.removeAttribute('tabindex');
      }, 100);
    }
  }, []);
  
  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, []);
  
  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  }, []);
  
  return {
    focusElement,
    focusFirst,
    focusLast
  };
}
