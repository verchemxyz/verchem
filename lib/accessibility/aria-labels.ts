// ARIA labels and descriptions for common UI elements
export const ARIA_LABELS = {
  // Navigation
  mainNavigation: 'Main navigation',
  skipToMain: 'Skip to main content',
  skipToNavigation: 'Skip to navigation',
  
  // Periodic Table
  periodicTable: 'Interactive periodic table of elements',
  element: (symbol: string, name: string) => `${name} (${symbol})`,
  elementGroup: (group: string) => `${group} elements`,
  period: (number: number) => `Period ${number}`,
  group: (number: number) => `Group ${number}`,
  
  // 3D Viewer
  viewer3d: 'Three-dimensional molecular viewer',
  rotateUp: 'Rotate view up',
  rotateDown: 'Rotate view down',
  rotateLeft: 'Rotate view left',
  rotateRight: 'Rotate view right',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetView: 'Reset view to default position',
  autoRotate: 'Toggle automatic rotation',
  
  // Molecule Builder
  moleculeBuilder: 'Interactive molecule builder',
  atomTool: 'Atom placement tool',
  bondTool: 'Bond creation tool',
  eraserTool: 'Eraser tool',
  moveTool: 'Move tool',
  selectAtom: (element: string) => `Select ${element} atom`,
  selectBond: (type: string) => `Select ${type} bond`,
  deleteSelected: 'Delete selected items',
  clearCanvas: 'Clear entire canvas',
  
  // Calculator
  calculator: 'Chemistry calculator',
  inputField: 'Calculation input field',
  calculateButton: 'Calculate result',
  clearButton: 'Clear input',
  resultDisplay: 'Calculation result',
  scientificMode: 'Toggle scientific calculator mode',
  
  // General UI
  close: 'Close',
  open: 'Open',
  delete: 'Delete',
  save: 'Save',
  export: 'Export',
  import: 'Import',
  settings: 'Settings',
  help: 'Help',
  menu: 'Menu',
  submenu: 'Submenu',
  toggle: 'Toggle',
  expand: 'Expand',
  collapse: 'Collapse',
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  
  // Form elements
  required: 'required',
  optional: 'optional',
  invalid: 'invalid input',
  valid: 'valid input',
  
  // Status messages
  calculationComplete: 'Calculation completed successfully',
  calculationError: 'Calculation error occurred',
  loadingData: 'Loading data',
  dataLoaded: 'Data loaded successfully',
  errorLoading: 'Error loading data',
  
  // Live regions
  liveRegionPolite: 'Status updates',
  liveRegionAssertive: 'Important notifications'
} as const;

// Helper function to create ARIA labels for dynamic content
export function createElementLabel(element: string, index?: number): string {
  if (index !== undefined) {
    return `${element} ${index + 1}`;
  }
  return element;
}

// Helper function to create ARIA descriptions
export function createElementDescription(
  type: string, 
  properties?: Record<string, unknown>
): string {
  const descriptions: Record<string, string> = {
    atom: 'Chemical atom that can be placed on the canvas',
    bond: 'Chemical bond connecting atoms',
    molecule: 'Group of atoms bonded together',
    element: 'Chemical element from the periodic table',
    calculator: 'Tool for performing chemical calculations',
    viewer: 'Interactive visualization tool'
  };
  
  let description = descriptions[type] || 'Interactive element';
  
  if (properties) {
    const propertyDescriptions = Object.entries(properties)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    description += `. Properties: ${propertyDescriptions}`;
  }
  
  return description;
}

// Helper function to create ARIA labels for calculator buttons
export function createCalculatorButtonLabel(
  button: string, 
  functionType?: string
): string {
  const labels: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '.': 'Decimal point',
    '+': 'Add',
    '-': 'Subtract',
    '*': 'Multiply',
    '/': 'Divide',
    '=': 'Equals',
    'C': 'Clear',
    'CE': 'Clear entry',
    '←': 'Backspace',
    '±': 'Toggle sign',
    '%': 'Percentage',
    '√': 'Square root',
    'x²': 'Square',
    'xʸ': 'Power',
    'sin': 'Sine',
    'cos': 'Cosine',
    'tan': 'Tangent',
    'ln': 'Natural logarithm',
    'log': 'Logarithm',
    'π': 'Pi',
    'e': 'Euler\'s number',
    '(': 'Open parenthesis',
    ')': 'Close parenthesis'
  };
  
  let label = labels[button] || button;
  
  if (functionType) {
    label += ` ${functionType}`;
  }
  
  return `${label} button`;
}

// Helper function to create ARIA labels for 3D viewer controls
export function createViewerControlLabel(
  control: string, 
  action?: string
): string {
  const labels: Record<string, string> = {
    rotate: 'Rotate view',
    zoom: 'Zoom view',
    pan: 'Pan view',
    reset: 'Reset view',
    fullscreen: 'Toggle fullscreen',
    screenshot: 'Take screenshot',
    settings: 'Viewer settings',
    help: 'Viewer help'
  };
  
  let label = labels[control] || control;
  
  if (action) {
    label += ` - ${action}`;
  }
  
  return label;
}

// Helper function to validate ARIA attributes
export function validateARIAAttributes(element: HTMLElement): string[] {
  const errors: string[] = [];
  
  // Check for required ARIA attributes
  const role = element.getAttribute('role');
  if (role) {
    const requiredAttributes: Record<string, string[]> = {
      'button': ['aria-label', 'aria-labelledby'],
      'link': ['aria-label', 'aria-labelledby'],
      'textbox': ['aria-label', 'aria-labelledby'],
      'checkbox': ['aria-label', 'aria-labelledby'],
      'radio': ['aria-label', 'aria-labelledby'],
      'combobox': ['aria-label', 'aria-labelledby'],
      'menu': ['aria-label', 'aria-labelledby'],
      'menuitem': ['aria-label', 'aria-labelledby'],
      'tab': ['aria-label', 'aria-labelledby'],
      'tabpanel': ['aria-label', 'aria-labelledby'],
      'dialog': ['aria-label', 'aria-labelledby'],
      'alert': ['aria-label', 'aria-labelledby'],
      'status': ['aria-label', 'aria-labelledby'],
      'progressbar': ['aria-label', 'aria-labelledby'],
      'slider': ['aria-label', 'aria-labelledby'],
      'spinbutton': ['aria-label', 'aria-labelledby']
    };
    
    const required = requiredAttributes[role];
    if (required) {
      const hasRequired = required.some(attr => element.hasAttribute(attr));
      if (!hasRequired) {
        errors.push(`Element with role "${role}" missing required ARIA label`);
      }
    }
  }
  
  // Check for valid ARIA attribute values
  const ariaInvalid = element.getAttribute('aria-invalid');
  if (ariaInvalid && !['true', 'false', 'grammar', 'spelling'].includes(ariaInvalid)) {
    errors.push('Invalid aria-invalid value');
  }
  
  const ariaLive = element.getAttribute('aria-live');
  if (ariaLive && !['off', 'polite', 'assertive'].includes(ariaLive)) {
    errors.push('Invalid aria-live value');
  }
  
  const ariaRelevant = element.getAttribute('aria-relevant');
  if (ariaRelevant) {
    const validValues = ['additions', 'removals', 'text', 'all'];
    const values = ariaRelevant.split(' ');
    const hasInvalid = values.some(value => !validValues.includes(value));
    if (hasInvalid) {
      errors.push('Invalid aria-relevant value');
    }
  }
  
  return errors;
}
