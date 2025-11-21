export interface Shortcut {
  key: string;
  description: string;
  category: ShortcutCategory;
  global?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export enum ShortcutCategory {
  NAVIGATION = 'navigation',
  TOOLS = 'tools',
  CALCULATOR = 'calculator',
  VIEWER_3D = 'viewer-3d',
  MOLECULE_BUILDER = 'molecule-builder',
  GENERAL = 'general'
}

export const GLOBAL_SHORTCUTS: Shortcut[] = [
  // Navigation shortcuts
  { key: 'Alt+N', description: 'Go to Periodic Table', category: ShortcutCategory.NAVIGATION, global: true },
  { key: 'Alt+3', description: 'Go to 3D Viewer', category: ShortcutCategory.NAVIGATION, global: true },
  { key: 'Alt+M', description: 'Go to Molecule Builder', category: ShortcutCategory.NAVIGATION, global: true },
  { key: 'Alt+H', description: 'Go to Home', category: ShortcutCategory.NAVIGATION, global: true },
  { key: 'Alt+S', description: 'Go to Search', category: ShortcutCategory.NAVIGATION, global: true },
  { key: 'Alt+T', description: 'Go to Tutorials', category: ShortcutCategory.NAVIGATION, global: true },
  
  // Tools shortcuts
  { key: 'Alt+C', description: 'Open Calculators Menu', category: ShortcutCategory.TOOLS, global: true },
  { key: 'Alt+E', description: 'Export Data', category: ShortcutCategory.TOOLS, global: true },
  { key: 'Alt+L', description: 'Change Language', category: ShortcutCategory.TOOLS, global: true },
  
  // General shortcuts
  { key: 'Ctrl+?', description: 'Show Help', category: ShortcutCategory.GENERAL, global: true },
  { key: 'Ctrl+/', description: 'Show Keyboard Shortcuts', category: ShortcutCategory.GENERAL, global: true },
  { key: 'Escape', description: 'Close Modal/Dialog', category: ShortcutCategory.GENERAL, global: true },
];

export const CALCULATOR_SHORTCUTS: Shortcut[] = [
  { key: 'Ctrl+Enter', description: 'Calculate Result', category: ShortcutCategory.CALCULATOR },
  { key: 'Ctrl+R', description: 'Reset Calculator', category: ShortcutCategory.CALCULATOR },
  { key: 'Ctrl+S', description: 'Save Result', category: ShortcutCategory.CALCULATOR },
  { key: 'Ctrl+Z', description: 'Undo Last Action', category: ShortcutCategory.CALCULATOR },
  { key: 'Ctrl+Shift+Z', description: 'Redo Action', category: ShortcutCategory.CALCULATOR },
];

export const VIEWER_3D_SHORTCUTS: Shortcut[] = [
  { key: 'ArrowUp', description: 'Rotate Up', category: ShortcutCategory.VIEWER_3D },
  { key: 'ArrowDown', description: 'Rotate Down', category: ShortcutCategory.VIEWER_3D },
  { key: 'ArrowLeft', description: 'Rotate Left', category: ShortcutCategory.VIEWER_3D },
  { key: 'ArrowRight', description: 'Rotate Right', category: ShortcutCategory.VIEWER_3D },
  { key: '+', description: 'Zoom In', category: ShortcutCategory.VIEWER_3D },
  { key: '-', description: 'Zoom Out', category: ShortcutCategory.VIEWER_3D },
  { key: 'Space', description: 'Toggle Auto-Rotate', category: ShortcutCategory.VIEWER_3D },
  { key: 'R', description: 'Reset View', category: ShortcutCategory.VIEWER_3D },
];

export const MOLECULE_BUILDER_SHORTCUTS: Shortcut[] = [
  { key: 'A', description: 'Select Atom Tool', category: ShortcutCategory.MOLECULE_BUILDER },
  { key: 'B', description: 'Select Bond Tool', category: ShortcutCategory.MOLECULE_BUILDER },
  { key: 'E', description: 'Select Eraser Tool', category: ShortcutCategory.MOLECULE_BUILDER },
  { key: 'M', description: 'Select Move Tool', category: ShortcutCategory.MOLECULE_BUILDER },
  { key: 'Delete', description: 'Delete Selected', category: ShortcutCategory.MOLECULE_BUILDER },
  { key: 'Ctrl+D', description: 'Duplicate Selection', category: ShortcutCategory.MOLECULE_BUILDER },
  { key: 'Ctrl+G', description: 'Group Selection', category: ShortcutCategory.MOLECULE_BUILDER },
];

export const ALL_SHORTCUTS = [
  ...GLOBAL_SHORTCUTS,
  ...CALCULATOR_SHORTCUTS,
  ...VIEWER_3D_SHORTCUTS,
  ...MOLECULE_BUILDER_SHORTCUTS,
];

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const parts = shortcut.key.split('+');
  const key = parts.pop()!;
  
  const hasCtrl = parts.includes('Ctrl') || parts.includes('Control');
  const hasAlt = parts.includes('Alt');
  const hasShift = parts.includes('Shift');
  
  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    event.ctrlKey === hasCtrl &&
    event.altKey === hasAlt &&
    event.shiftKey === hasShift
  );
}

export function getShortcutsByCategory(category: ShortcutCategory): Shortcut[] {
  return ALL_SHORTCUTS.filter(shortcut => shortcut.category === category);
}

export function getShortcutsByContext(context: string): Shortcut[] {
  switch (context) {
    case 'calculator':
      return CALCULATOR_SHORTCUTS;
    case '3d-viewer':
      return VIEWER_3D_SHORTCUTS;
    case 'molecule-builder':
      return MOLECULE_BUILDER_SHORTCUTS;
    default:
      return GLOBAL_SHORTCUTS;
  }
}
