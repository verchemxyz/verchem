import { Tutorial, HelpArticle, FAQItem } from './types';

export const tutorialData: Tutorial[] = [
  // Getting Started Tutorials
  {
    id: 'getting-started-navigation',
    title: 'Navigation Basics',
    description: 'Learn how to navigate through VerChem platform efficiently',
    category: 'getting-started',
    difficulty: 'beginner',
    estimatedTime: 5,
    icon: '🧭',
    featured: true,
    tags: ['navigation', 'basics', 'interface'],
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to VerChem!',
        content: 'Let\'s start with a quick tour of the navigation system. You\'ll learn how to access all the powerful chemistry tools.',
        target: 'body',
        placement: 'center',
        spotlight: true,
      },
      {
        id: 'main-nav',
        title: 'Main Navigation',
        content: 'This is your main navigation bar. It contains links to all major sections of VerChem.',
        target: '[data-tutorial="main-nav"]',
        placement: 'bottom',
        highlight: true,
      },
      {
        id: 'periodic-table-nav',
        title: 'Periodic Table Access',
        content: 'Click here to access the interactive periodic table with detailed element information.',
        target: '[data-tutorial="periodic-table-nav"]',
        placement: 'bottom',
        action: 'click',
        interactive: true,
      },
      {
        id: 'calculators-nav',
        title: 'Chemistry Calculators',
        content: 'Access all our chemistry calculators from this menu. Each calculator has its own tutorial.',
        target: '[data-tutorial="calculators-nav"]',
        placement: 'bottom',
        action: 'hover',
      },
      {
        id: 'help-button',
        title: 'Help is Always Available',
        content: 'Click this help button anytime to access tutorials, documentation, and support.',
        target: '[data-tutorial="help-button"]',
        placement: 'left',
        action: 'click',
        interactive: true,
      },
    ],
  },
  {
    id: 'getting-started-settings',
    title: 'Personalize Your Experience',
    description: 'Learn how to customize VerChem to suit your preferences',
    category: 'getting-started',
    difficulty: 'beginner',
    estimatedTime: 3,
    icon: '⚙️',
    tags: ['settings', 'preferences', 'customization'],
    steps: [
      {
        id: 'settings-intro',
        title: 'Settings & Preferences',
        content: 'Let\'s explore how to customize VerChem for your needs.',
        target: '[data-tutorial="settings-button"]',
        placement: 'bottom',
        action: 'click',
        interactive: true,
      },
      {
        id: 'theme-settings',
        title: 'Theme Selection',
        content: 'Choose between light and dark themes, or let the system decide automatically.',
        target: '[data-tutorial="theme-settings"]',
        placement: 'right',
      },
      {
        id: 'accessibility-settings',
        title: 'Accessibility Options',
        content: 'Enable accessibility features like high contrast, large text, and screen reader support.',
        target: '[data-tutorial="accessibility-settings"]',
        placement: 'right',
      },
    ],
  },

  // Periodic Table Tutorials
  {
    id: 'periodic-table-basics',
    title: 'Periodic Table Fundamentals',
    description: 'Master the basics of using the interactive periodic table',
    category: 'periodic-table',
    difficulty: 'beginner',
    estimatedTime: 8,
    icon: '🧪',
    featured: true,
    tags: ['periodic-table', 'elements', 'basics'],
    steps: [
      {
        id: 'pt-overview',
        title: 'Periodic Table Overview',
        content: 'This is our interactive periodic table. Each element is clickable and provides detailed information.',
        target: '[data-tutorial="periodic-table"]',
        placement: 'top',
        spotlight: true,
      },
      {
        id: 'element-click',
        title: 'Element Information',
        content: 'Click on any element to see its detailed properties, electron configuration, and more.',
        target: '[data-element="H"]',
        placement: 'right',
        action: 'click',
        interactive: true,
      },
      {
        id: 'element-details',
        title: 'Detailed Element Data',
        content: 'Here you can see comprehensive information about the selected element including physical and chemical properties.',
        target: '[data-tutorial="element-details"]',
        placement: 'left',
      },
      {
        id: 'periodic-trends',
        title: 'Periodic Trends',
        content: 'Use this feature to visualize periodic trends like atomic radius, electronegativity, and ionization energy.',
        target: '[data-tutorial="periodic-trends"]',
        placement: 'top',
        action: 'click',
        interactive: true,
      },
      {
        id: 'element-search',
        title: 'Search Elements',
        content: 'Quickly find elements by name, symbol, or atomic number using the search function.',
        target: '[data-tutorial="element-search"]',
        placement: 'bottom',
      },
    ],
  },

  // 3D Molecular Viewer Tutorials
  {
    id: '3d-viewer-basics',
    title: '3D Molecular Viewer Basics',
    description: 'Learn to navigate and manipulate 3D molecular structures',
    category: '3d-viewer',
    difficulty: 'beginner',
    estimatedTime: 10,
    icon: '🔬',
    featured: true,
    tags: ['3d-viewer', 'molecules', 'visualization'],
    steps: [
      {
        id: '3d-viewer-intro',
        title: '3D Molecular Viewer',
        content: 'Welcome to the 3D molecular viewer! You can rotate, zoom, and examine molecular structures in detail.',
        target: '[data-tutorial="3d-viewer"]',
        placement: 'top',
        spotlight: true,
      },
      {
        id: 'molecule-rotation',
        title: 'Rotate the Molecule',
        content: 'Click and drag to rotate the molecule. Hold Shift while dragging for precise control.',
        target: '[data-tutorial="3d-canvas"]',
        placement: 'center',
        action: 'click',
        interactive: true,
      },
      {
        id: 'zoom-controls',
        title: 'Zoom In/Out',
        content: 'Use the mouse wheel to zoom in and out. You can also use the zoom buttons in the control panel.',
        target: '[data-tutorial="zoom-controls"]',
        placement: 'left',
      },
      {
        id: 'display-modes',
        title: 'Display Modes',
        content: 'Switch between different display modes: ball-and-stick, space-filling, wireframe, and more.',
        target: '[data-tutorial="display-modes"]',
        placement: 'top',
        action: 'click',
        interactive: true,
      },
      {
        id: 'molecule-info',
        title: 'Molecule Information',
        content: 'View detailed information about the molecule including formula, molecular weight, and properties.',
        target: '[data-tutorial="molecule-info"]',
        placement: 'right',
      },
    ],
  },

  // Molecule Builder Tutorials
  {
    id: 'molecule-builder-basics',
    title: 'Building Molecules',
    description: 'Learn to build and edit molecular structures',
    category: 'molecule-builder',
    difficulty: 'intermediate',
    estimatedTime: 12,
    icon: '🏗️',
    featured: true,
    tags: ['molecule-builder', 'drawing', 'editing'],
    steps: [
      {
        id: 'builder-intro',
        title: 'Molecule Builder',
        content: 'Build molecules by adding atoms and bonds. The tool will validate your structure and provide feedback.',
        target: '[data-tutorial="molecule-builder"]',
        placement: 'top',
        spotlight: true,
      },
      {
        id: 'atom-palette',
        title: 'Atom Palette',
        content: 'Select atoms from the periodic table palette. Common atoms are readily available.',
        target: '[data-tutorial="atom-palette"]',
        placement: 'right',
        action: 'click',
        interactive: true,
      },
      {
        id: 'adding-atoms',
        title: 'Adding Atoms',
        content: 'Click in the canvas to add the selected atom. Drag to create bonds between atoms.',
        target: '[data-tutorial="builder-canvas"]',
        placement: 'center',
        action: 'click',
        interactive: true,
      },
      {
        id: 'bond-types',
        title: 'Bond Types',
        content: 'Create single, double, or triple bonds by selecting the bond tool and clicking between atoms.',
        target: '[data-tutorial="bond-tools"]',
        placement: 'top',
      },
      {
        id: 'structure-validation',
        title: 'Structure Validation',
        content: 'The builder automatically validates your structure and highlights any issues with valency or connectivity.',
        target: '[data-tutorial="validation-panel"]',
        placement: 'left',
      },
      {
        id: 'save-export',
        title: 'Save and Export',
        content: 'Save your molecule or export it in various formats including SMILES, InChI, and 3D coordinates.',
        target: '[data-tutorial="save-export"]',
        placement: 'bottom',
      },
    ],
  },

  // Calculator Tutorials
  {
    id: 'stoichiometry-calculator',
    title: 'Stoichiometry Calculator',
    description: 'Master chemical equation balancing and stoichiometric calculations',
    category: 'calculators',
    difficulty: 'intermediate',
    estimatedTime: 15,
    icon: '⚖️',
    featured: true,
    tags: ['stoichiometry', 'balancing', 'calculations'],
    steps: [
      {
        id: 'stoich-intro',
        title: 'Stoichiometry Calculator',
        content: 'Balance chemical equations and perform stoichiometric calculations with step-by-step guidance.',
        target: '[data-tutorial="stoichiometry-calculator"]',
        placement: 'top',
        spotlight: true,
      },
      {
        id: 'equation-input',
        title: 'Enter Chemical Equation',
        content: 'Type your chemical equation here. Use proper chemical formulas and state symbols.',
        target: '[data-tutorial="equation-input"]',
        placement: 'top',
        action: 'input',
        interactive: true,
      },
      {
        id: 'balancing-process',
        title: 'Automatic Balancing',
        content: 'Watch as the calculator balances your equation step by step with clear explanations.',
        target: '[data-tutorial="balancing-steps"]',
        placement: 'right',
      },
      {
        id: 'stoichiometric-ratios',
        title: 'Stoichiometric Ratios',
        content: 'Understand the mole ratios between reactants and products in your balanced equation.',
        target: '[data-tutorial="mole-ratios"]',
        placement: 'bottom',
      },
      {
        id: 'limiting-reagent',
        title: 'Limiting Reagent',
        content: 'Identify the limiting reagent and calculate theoretical yield with detailed explanations.',
        target: '[data-tutorial="limiting-reagent"]',
        placement: 'left',
      },
    ],
  },
  {
    id: 'molarity-calculator',
    title: 'Solution Concentration Calculator',
    description: 'Calculate molarity, dilutions, and solution preparation',
    category: 'calculators',
    difficulty: 'beginner',
    estimatedTime: 8,
    icon: '💧',
    tags: ['solutions', 'molarity', 'concentration'],
    steps: [
      {
        id: 'molarity-intro',
        title: 'Solution Calculator',
        content: 'Calculate solution concentrations, perform dilutions, and determine preparation methods.',
        target: '[data-tutorial="molarity-calculator"]',
        placement: 'top',
        spotlight: true,
      },
      {
        id: 'molarity-calc',
        title: 'Molarity Calculations',
        content: 'Enter any two values (moles, volume, or molarity) to calculate the third.',
        target: '[data-tutorial="molarity-input"]',
        placement: 'top',
        interactive: true,
      },
      {
        id: 'dilution-calc',
        title: 'Dilution Calculations',
        content: 'Use M1V1 = M2V2 to calculate dilution parameters. Perfect for lab preparations.',
        target: '[data-tutorial="dilution-input"]',
        placement: 'top',
        interactive: true,
      },
      {
        id: 'preparation-guide',
        title: 'Preparation Guide',
        content: 'Get step-by-step instructions for preparing your solution in the lab.',
        target: '[data-tutorial="preparation-steps"]',
        placement: 'right',
      },
    ],
  },

  // Advanced Features Tutorials
  {
    id: 'export-features',
    title: 'Export and Sharing',
    description: 'Learn to export data and share your work',
    category: 'advanced-features',
    difficulty: 'intermediate',
    estimatedTime: 6,
    icon: '📤',
    tags: ['export', 'sharing', 'data'],
    steps: [
      {
        id: 'export-intro',
        title: 'Export Options',
        content: 'VerChem supports multiple export formats for sharing your work and data.',
        target: '[data-tutorial="export-button"]',
        placement: 'bottom',
        spotlight: true,
      },
      {
        id: 'image-export',
        title: 'Image Export',
        content: 'Export molecular structures, graphs, and tables as high-quality images.',
        target: '[data-tutorial="image-export"]',
        placement: 'right',
        action: 'click',
        interactive: true,
      },
      {
        id: 'data-export',
        title: 'Data Export',
        content: 'Export calculation results and data in CSV, JSON, or PDF formats.',
        target: '[data-tutorial="data-export"]',
        placement: 'right',
      },
      {
        id: 'sharing-options',
        title: 'Sharing Options',
        content: 'Share your work via email, social media, or generate shareable links.',
        target: '[data-tutorial="sharing-options"]',
        placement: 'right',
      },
    ],
  },
  {
    id: 'search-features',
    title: 'Advanced Search',
    description: 'Master the search functionality across all VerChem tools',
    category: 'advanced-features',
    difficulty: 'intermediate',
    estimatedTime: 5,
    icon: '🔍',
    tags: ['search', 'filtering', 'navigation'],
    steps: [
      {
        id: 'search-intro',
        title: 'Global Search',
        content: 'Use the search bar to find elements, compounds, calculations, and help content.',
        target: '[data-tutorial="search-bar"]',
        placement: 'bottom',
        spotlight: true,
      },
      {
        id: 'search-filters',
        title: 'Search Filters',
        content: 'Narrow your search results using filters for content type, category, and relevance.',
        target: '[data-tutorial="search-filters"]',
        placement: 'bottom',
      },
      {
        id: 'search-shortcuts',
        title: 'Search Shortcuts',
        content: 'Use keyboard shortcuts like Ctrl+K to quickly open the search dialog.',
        target: '[data-tutorial="search-shortcuts"]',
        placement: 'left',
      },
    ],
  },

  // Chemistry Concepts Tutorials
  {
    id: 'chemical-bonding-basics',
    title: 'Chemical Bonding Fundamentals',
    description: 'Understanding ionic, covalent, and metallic bonds',
    category: 'chemistry-concepts',
    difficulty: 'beginner',
    estimatedTime: 10,
    icon: '⚛️',
    featured: true,
    tags: ['bonding', 'concepts', 'fundamentals'],
    steps: [
      {
        id: 'bonding-intro',
        title: 'Types of Chemical Bonds',
        content: 'Learn about the three main types of chemical bonds that hold atoms together.',
        target: '[data-tutorial="bonding-visualization"]',
        placement: 'top',
        spotlight: true,
      },
      {
        id: 'ionic-bonds',
        title: 'Ionic Bonds',
        content: 'Ionic bonds form between metals and non-metals through electron transfer.',
        target: '[data-tutorial="ionic-bond-example"]',
        placement: 'right',
        action: 'click',
        interactive: true,
      },
      {
        id: 'covalent-bonds',
        title: 'Covalent Bonds',
        content: 'Covalent bonds involve sharing electrons between atoms.',
        target: '[data-tutorial="covalent-bond-example"]',
        placement: 'right',
        action: 'click',
        interactive: true,
      },
      {
        id: 'metallic-bonds',
        title: 'Metallic Bonds',
        content: 'Metallic bonds involve a "sea" of delocalized electrons.',
        target: '[data-tutorial="metallic-bond-example"]',
        placement: 'right',
        action: 'click',
        interactive: true,
      },
      {
        id: 'bond-properties',
        title: 'Bond Properties',
        content: 'Compare properties of different bond types including strength, melting point, and conductivity.',
        target: '[data-tutorial="bond-properties"]',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'molecular-geometry',
    title: 'Molecular Geometry and VSEPR',
    description: 'Understanding molecular shapes using VSEPR theory',
    category: 'chemistry-concepts',
    difficulty: 'intermediate',
    estimatedTime: 12,
    icon: '🎯',
    tags: ['VSEPR', 'geometry', 'shapes'],
    steps: [
      {
        id: 'vsepr-intro',
        title: 'VSEPR Theory',
        content: 'Valence Shell Electron Pair Repulsion theory predicts molecular shapes based on electron pair repulsion.',
        target: '[data-tutorial="vsepr-intro"]',
        placement: 'top',
        spotlight: true,
      },
      {
        id: 'electron-domains',
        title: 'Electron Domains',
        content: 'Count bonding pairs and lone pairs to determine electron domain geometry.',
        target: '[data-tutorial="electron-domains"]',
        placement: 'right',
        interactive: true,
      },
      {
        id: 'molecular-shapes',
        title: 'Common Molecular Shapes',
        content: 'Learn to identify linear, trigonal planar, tetrahedral, and other common shapes.',
        target: '[data-tutorial="shape-gallery"]',
        placement: 'bottom',
        action: 'click',
        interactive: true,
      },
      {
        id: 'bond-angles',
        title: 'Bond Angles',
        content: 'Understand how electron repulsion affects bond angles in molecules.',
        target: '[data-tutorial="bond-angles"]',
        placement: 'left',
      },
      {
        id: 'polarity',
        title: 'Molecular Polarity',
        content: 'Determine molecular polarity based on shape and bond polarity.',
        target: '[data-tutorial="polarity-analysis"]',
        placement: 'right',
      },
    ],
  },
];

export const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started-guide',
    title: 'Getting Started with VerChem',
    content: `VerChem is a comprehensive chemistry platform designed to make chemistry accessible and interactive. 

## Quick Start
1. **Navigation**: Use the main navigation bar to access different tools
2. **Periodic Table**: Click on elements to view detailed information
3. **Calculators**: Access various chemistry calculators from the Calculators menu
4. **Help**: Click the help button in the top-right corner for assistance

## First Steps
- Take the "Navigation Basics" tutorial
- Explore the periodic table
- Try the stoichiometry calculator
- Build a simple molecule

## Tips
- Use keyboard shortcuts (Ctrl+/ to view them all)
- Enable accessibility features in settings
- Take tutorials for each tool you use
- Check the glossary for unfamiliar terms`,
    category: 'getting-started',
    tags: ['beginner', 'guide', 'introduction'],
    lastUpdated: new Date('2024-01-15'),
    views: 0,
    helpful: 0,
    notHelpful: 0,
  },
  {
    id: 'periodic-table-guide',
    title: 'Using the Periodic Table',
    content: `The periodic table is a powerful tool for exploring chemical elements and their properties.

## Features
- **Interactive Elements**: Click any element for detailed information
- **Periodic Trends**: Visualize trends across periods and groups
- **Element Search**: Find elements by name, symbol, or atomic number
- **Property Filters**: Filter elements by various properties

## Element Information
Each element page includes:
- Basic properties (atomic mass, electron configuration)
- Physical properties (melting/boiling points, density)
- Chemical properties (common oxidation states, reactivity)
- Historical information and uses

## Tips
- Hover over elements for quick previews
- Use the trend visualization for comparative analysis
- Bookmark frequently used elements
- Export element data for reports`,
    category: 'features',
    tags: ['periodic-table', 'elements', 'properties'],
    lastUpdated: new Date('2024-01-15'),
    views: 0,
    helpful: 0,
    notHelpful: 0,
  },
  {
    id: '3d-viewer-guide',
    title: '3D Molecular Viewer Controls',
    content: `Navigate and manipulate 3D molecular structures with ease.

## Basic Controls
- **Rotate**: Click and drag with left mouse button
- **Zoom**: Use mouse wheel or pinch gesture
- **Pan**: Right-click and drag or use two fingers
- **Reset**: Press R key or click reset button

## Display Modes
- **Ball-and-Stick**: Atoms as spheres, bonds as cylinders
- **Space-Filling**: Atoms sized by van der Waals radius
- **Wireframe**: Minimal representation with lines
- **Ribbon**: For proteins and large biomolecules

## Advanced Features
- **Measurement**: Measure bond lengths and angles
- **Labeling**: Show atom labels and numbers
- **Coloring**: Color by element, charge, or custom schemes
- **Animation**: View molecular vibrations and rotations

## Keyboard Shortcuts
- **R**: Reset view
- **F**: Focus on selection
- **L**: Toggle labels
- **M**: Toggle measurement mode`,
    category: 'features',
    tags: ['3d-viewer', 'controls', 'visualization'],
    lastUpdated: new Date('2024-01-15'),
    views: 0,
    helpful: 0,
    notHelpful: 0,
  },
  {
    id: 'troubleshooting-common-issues',
    title: 'Common Issues and Solutions',
    content: `Solutions to frequently encountered problems.

## Display Issues
**Problem**: 3D viewer shows black screen
**Solution**: Update your graphics drivers and enable WebGL in browser settings

**Problem**: Periodic table elements not loading
**Solution**: Clear browser cache and refresh the page

## Calculation Errors
**Problem**: Calculator shows "Invalid Input"
**Solution**: Check chemical formulas for proper capitalization and subscripts

**Problem**: Results seem incorrect
**Solution**: Verify input units and check the calculation steps provided

## Performance Issues
**Problem**: Slow loading or laggy interface
**Solution**: Close other browser tabs, disable browser extensions, or try a different browser

**Problem**: Large molecules load slowly
**Solution**: Use simplified display modes and reduce molecular complexity

## Browser Compatibility
- **Recommended**: Chrome, Firefox, Safari (latest versions)
- **Required**: JavaScript and WebGL enabled
- **Mobile**: Use landscape mode for best experience`,
    category: 'troubleshooting',
    tags: ['issues', 'problems', 'solutions'],
    lastUpdated: new Date('2024-01-15'),
    views: 0,
    helpful: 0,
    notHelpful: 0,
  },
  {
    id: 'keyboard-shortcuts-reference',
    title: 'Keyboard Shortcuts Reference',
    content: `Complete list of keyboard shortcuts for efficient navigation.

## Global Shortcuts
- **Ctrl+/**: Show keyboard shortcuts dialog
- **Ctrl+K**: Open search
- **Ctrl+H**: Toggle help sidebar
- **Tab**: Navigate through interactive elements
- **Shift+Tab**: Navigate backwards

## Tutorial Shortcuts
- **Space**: Next tutorial step
- **Backspace**: Previous tutorial step
- **Escape**: Exit tutorial
- **P**: Pause/Resume tutorial

## 3D Viewer Shortcuts
- **R**: Reset view
- **F**: Focus on selection
- **L**: Toggle labels
- **M**: Toggle measurement mode
- **1-9**: Switch display modes

## Calculator Shortcuts
- **Enter**: Calculate
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Ctrl+C**: Copy results
- **Ctrl+S**: Save calculation`,
    category: 'keyboard-shortcuts',
    tags: ['shortcuts', 'keyboard', 'efficiency'],
    lastUpdated: new Date('2024-01-15'),
    views: 0,
    helpful: 0,
    notHelpful: 0,
  },
];

export const faqData: FAQItem[] = [
  {
    id: 'what-is-verchem',
    question: 'What is VerChem?',
    answer: 'VerChem is a comprehensive chemistry platform that provides interactive tools, calculators, and educational resources for chemistry students and professionals.',
    category: 'General',
    tags: ['introduction', 'overview'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'is-verchem-free',
    question: 'Is VerChem free to use?',
    answer: 'Yes, VerChem offers a free tier with access to basic features. Premium features may be available in the future.',
    category: 'General',
    tags: ['pricing', 'free'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'browser-requirements',
    question: 'What are the browser requirements?',
    answer: 'VerChem works best on modern browsers (Chrome, Firefox, Safari, Edge) with JavaScript and WebGL enabled.',
    category: 'Technical',
    tags: ['browser', 'requirements'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'mobile-support',
    question: 'Does VerChem work on mobile devices?',
    answer: 'Yes, VerChem is responsive and works on mobile devices, though some features may be easier to use on larger screens.',
    category: 'Technical',
    tags: ['mobile', 'responsive'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'data-accuracy',
    question: 'How accurate is the data in VerChem?',
    answer: 'We use authoritative sources like NIST, IUPAC, and peer-reviewed literature. Data is regularly updated and verified.',
    category: 'Data',
    tags: ['accuracy', 'sources'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'export-options',
    question: 'What export options are available?',
    answer: 'You can export data as images (PNG, SVG), documents (PDF), and data files (CSV, JSON). 3D structures can be exported in common chemical formats.',
    category: 'Features',
    tags: ['export', 'formats'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'accessibility-features',
    question: 'What accessibility features are available?',
    answer: 'VerChem includes screen reader support, keyboard navigation, high contrast mode, adjustable font sizes, and color-blind friendly palettes.',
    category: 'Accessibility',
    tags: ['accessibility', 'inclusive'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'tutorial-help',
    question: 'How do I get help with tutorials?',
    answer: 'Click the help button in the top-right corner or press Ctrl+H to access tutorials, documentation, and support resources.',
    category: 'Help',
    tags: ['tutorials', 'help'],
    views: 0,
    helpful: 0,
    lastUpdated: new Date('2024-01-15'),
  },
];