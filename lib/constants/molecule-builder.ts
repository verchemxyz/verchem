/**
 * VerChem - Molecule Builder Constants
 * Centralized configuration for consistent behavior across the application
 */

/**
 * Canvas Configuration
 */
export const CANVAS = {
  /** Default canvas size in pixels */
  DEFAULT_SIZE: 600,
  /** Maximum canvas size on desktop */
  MAX_SIZE_DESKTOP: 720,
  /** Padding from canvas edges to prevent atoms from going out of bounds */
  PADDING: 24,
  /** Mobile breakpoint in pixels */
  MOBILE_BREAKPOINT: 768,
} as const

/**
 * Atom Configuration
 */
export const ATOM = {
  /** Default atom radius in pixels */
  RADIUS: 20,
  /** Atom radius when hovered or selected */
  RADIUS_SELECTED: 25,
  /** Hit area radius for click/touch detection */
  HIT_RADIUS: 25,
  /** Glow size for atoms needing electrons (min) */
  GLOW_SIZE_MIN: 30,
  /** Glow size for atoms needing electrons (max) */
  GLOW_SIZE_MAX: 40,
} as const

/**
 * Bond Configuration
 */
export const BOND = {
  /** Bond line width */
  LINE_WIDTH: 2,
  /** Bond line width when selected */
  LINE_WIDTH_SELECTED: 4,
  /** Distance between parallel lines for double/triple bonds */
  PARALLEL_OFFSET: 6,
  /** Click threshold distance for bond selection (pixels) */
  CLICK_THRESHOLD: 10,
  /** Touch threshold distance for bond selection (pixels) */
  TOUCH_THRESHOLD: 15,
  /** Maximum distance to create bond between atoms (pixels) */
  MAX_BOND_DISTANCE: 100,
} as const

/**
 * Animation Configuration
 */
export const ANIMATION = {
  /** Blink animation increment per frame */
  BLINK_INCREMENT: 0.1,
  /** Shake animation distance (pixels) */
  SHAKE_DISTANCE: 4,
  /** Shake animation duration (milliseconds) */
  SHAKE_DURATION: 500,
  /** Toast exit animation duration (milliseconds) */
  TOAST_EXIT_DURATION: 200,
  /** Default toast display duration (milliseconds) */
  TOAST_DURATION: 4000,
} as const

/**
 * History Configuration
 */
export const HISTORY = {
  /** Maximum number of undo/redo steps */
  MAX_STEPS: 50,
} as const

/**
 * Zoom Configuration
 */
export const ZOOM = {
  /** Minimum zoom level */
  MIN_SCALE: 0.5,
  /** Maximum zoom level */
  MAX_SCALE: 2.0,
  /** Default zoom level */
  DEFAULT_SCALE: 1.0,
  /** Zoom increment/decrement per pinch gesture */
  PINCH_SENSITIVITY: 0.01,
} as const

/**
 * Colors Configuration
 */
export const COLORS = {
  /** Connection line color while creating bond */
  CONNECTION_LINE: '#00ff00',
  /** Selected element border color */
  SELECTED_BORDER: '#00ffff',
  /** Hovered element border color */
  HOVER_BORDER: '#ffff00',
  /** Normal bond color */
  BOND_NORMAL: '#666666',
  /** Selected bond color */
  BOND_SELECTED: '#00ffff',
  /** Positive formal charge color */
  CHARGE_POSITIVE: '#ff6666',
  /** Negative formal charge color */
  CHARGE_NEGATIVE: '#6666ff',
  /** Electron need indicator color */
  ELECTRON_NEED: '#ffaa00',
} as const

/**
 * Interaction Configuration
 */
export const INTERACTION = {
  /** Minimum distance to detect drag vs click (pixels) */
  DRAG_THRESHOLD: 5,
  /** Debounce delay for resize events (milliseconds) */
  RESIZE_DEBOUNCE: 100,
  /** Long press duration for context menu (milliseconds) */
  LONG_PRESS_DURATION: 500,
} as const

/**
 * Element Groups for Palette
 */
export const ELEMENT_GROUPS = [
  {
    title: 'Backbone',
    hint: 'Standard organic scaffolds',
    items: [
      { symbol: 'C', name: 'Carbon' },
      { symbol: 'N', name: 'Nitrogen' },
      { symbol: 'O', name: 'Oxygen' },
      { symbol: 'H', name: 'Hydrogen' },
    ],
  },
  {
    title: 'Halogens',
    hint: 'Good leaving groups, single bonds',
    items: [
      { symbol: 'F', name: 'Fluorine' },
      { symbol: 'Cl', name: 'Chlorine' },
      { symbol: 'Br', name: 'Bromine' },
      { symbol: 'I', name: 'Iodine' },
    ],
  },
  {
    title: 'Expanded set',
    hint: 'Useful hetero atoms and frameworks',
    items: [
      { symbol: 'S', name: 'Sulfur' },
      { symbol: 'P', name: 'Phosphorus' },
      { symbol: 'B', name: 'Boron' },
      { symbol: 'Si', name: 'Silicon' },
    ],
  },
] as const

/**
 * Bond Options for UI
 */
export const BOND_OPTIONS = [
  { mode: 'single' as const, label: 'Single', symbol: '-' },
  { mode: 'double' as const, label: 'Double', symbol: '=' },
  { mode: 'triple' as const, label: 'Triple', symbol: '≡' },
] as const

/**
 * Default Presets
 */
export const PRESETS = {
  water: {
    label: 'Water',
    description: 'Bent 104.5 deg',
    layout: [
      { element: 'O', x: 340, y: 320 },
      { element: 'H', x: 280, y: 360 },
      { element: 'H', x: 400, y: 360 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 as const },
      { from: 0, to: 2, order: 1 as const },
    ],
    focusElement: 'O',
  },
  methane: {
    label: 'Methane',
    description: 'Tetrahedral projection',
    layout: [
      { element: 'C', x: 340, y: 320 },
      { element: 'H', x: 260, y: 320 },
      { element: 'H', x: 420, y: 320 },
      { element: 'H', x: 320, y: 240 },
      { element: 'H', x: 360, y: 400 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 as const },
      { from: 0, to: 2, order: 1 as const },
      { from: 0, to: 3, order: 1 as const },
      { from: 0, to: 4, order: 1 as const },
    ],
    focusElement: 'C',
  },
  carbonDioxide: {
    label: 'Carbon Dioxide',
    description: 'Linear 180 deg',
    layout: [
      { element: 'O', x: 240, y: 320 },
      { element: 'C', x: 340, y: 320 },
      { element: 'O', x: 440, y: 320 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 as const },
      { from: 1, to: 2, order: 2 as const },
    ],
    focusElement: 'O',
  },
  ammonia: {
    label: 'Ammonia',
    description: 'Trigonal pyramidal',
    layout: [
      { element: 'N', x: 340, y: 300 },
      { element: 'H', x: 270, y: 360 },
      { element: 'H', x: 410, y: 360 },
      { element: 'H', x: 340, y: 430 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 as const },
      { from: 0, to: 2, order: 1 as const },
      { from: 0, to: 3, order: 1 as const },
    ],
    focusElement: 'N',
  },
  benzene: {
    label: 'Benzene',
    description: 'Planar ring (alternating pi)',
    layout: [
      { element: 'C', x: 320, y: 200 },
      { element: 'C', x: 404, y: 230 },
      { element: 'C', x: 444, y: 310 },
      { element: 'C', x: 404, y: 390 },
      { element: 'C', x: 320, y: 420 },
      { element: 'C', x: 236, y: 390 },
      { element: 'H', x: 320, y: 130 },
      { element: 'H', x: 470, y: 205 },
      { element: 'H', x: 520, y: 310 },
      { element: 'H', x: 470, y: 415 },
      { element: 'H', x: 320, y: 490 },
      { element: 'H', x: 170, y: 315 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 as const },
      { from: 1, to: 2, order: 1 as const },
      { from: 2, to: 3, order: 2 as const },
      { from: 3, to: 4, order: 1 as const },
      { from: 4, to: 5, order: 2 as const },
      { from: 5, to: 0, order: 1 as const },
      { from: 0, to: 6, order: 1 as const },
      { from: 1, to: 7, order: 1 as const },
      { from: 2, to: 8, order: 1 as const },
      { from: 3, to: 9, order: 1 as const },
      { from: 4, to: 10, order: 1 as const },
      { from: 5, to: 11, order: 1 as const },
    ],
    focusElement: 'C',
  },
} as const

/**
 * Keyboard Shortcuts
 */
export const KEYBOARD = {
  /** Undo shortcut */
  UNDO: ['Control+z', 'Meta+z'],
  /** Redo shortcuts */
  REDO: ['Control+y', 'Control+Shift+z', 'Meta+Shift+z'],
  /** Delete shortcuts */
  DELETE: ['Delete', 'Backspace'],
  /** Select all */
  SELECT_ALL: ['Control+a', 'Meta+a'],
} as const