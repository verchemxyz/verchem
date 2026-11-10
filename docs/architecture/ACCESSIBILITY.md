# VerChem Accessibility System

## Overview

VerChem implements a comprehensive accessibility system that meets WCAG 2.1 AA standards, ensuring that chemistry education is accessible to everyone regardless of their abilities. The system includes keyboard navigation, screen reader support, visual accessibility features, and more.

## Features

### 🎹 Keyboard Navigation
- **Global Shortcuts**: Navigation between all major sections
- **Context-Specific Shortcuts**: Tool-specific keyboard commands
- **Calculator Shortcuts**: Full number pad and scientific function support
- **3D Viewer Controls**: Arrow keys for rotation, +/- for zoom
- **Molecule Builder Tools**: Keyboard shortcuts for atoms, bonds, and tools
- **Focus Management**: Proper focus handling and visible focus indicators

### 🔊 Screen Reader Support
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Dynamic content announcements
- **Semantic HTML**: Proper heading structure and landmarks
- **Role-Based Navigation**: Clear roles for all UI components
- **Status Announcements**: Real-time feedback for user actions
- **Error Messages**: Accessible error handling and validation

### 👁️ Visual Accessibility
- **High Contrast Mode**: Enhanced color contrast for better visibility
- **Font Size Scaling**: Three levels of text size (small, medium, large)
- **Reduced Motion**: Minimized animations for motion-sensitive users
- **Focus Indicators**: Clear visual focus indicators for keyboard navigation
- **Color Contrast**: WCAG AA compliant color combinations
- **Alternative Text**: Descriptive text for all images and graphics

### 🧭 Navigation Aids
- **Skip Links**: Jump to main content, navigation, and sections
- **Breadcrumb Navigation**: Clear path indication
- **Consistent Structure**: Predictable page layout and navigation
- **Page Landmarks**: Proper ARIA landmark roles
- **Heading Hierarchy**: Logical heading structure for screen readers

## Keyboard Shortcuts

### Global Navigation
| Shortcut | Action |
|----------|---------|
| `Alt+N` | Go to Periodic Table |
| `Alt+3` | Go to 3D Viewer |
| `Alt+M` | Go to Molecule Builder |
| `Alt+H` | Go to Home |
| `Alt+C` | Open Calculators Menu |
| `Alt+E` | Export Data |
| `Alt+L` | Change Language |
| `Ctrl+?` | Show Help |
| `Ctrl+/` | Show Keyboard Shortcuts |
| `Escape` | Close Modal/Dialog |

### Calculator Shortcuts
| Shortcut | Action |
|----------|---------|
| `Ctrl+Enter` | Calculate Result |
| `Ctrl+R` | Reset Calculator |
| `Ctrl+S` | Save Result |
| `Ctrl+Z` | Undo Last Action |
| `Ctrl+Shift+Z` | Redo Action |

### 3D Viewer Controls
| Shortcut | Action |
|----------|---------|
| `Arrow Keys` | Rotate View |
| `+` / `-` | Zoom In/Out |
| `Space` | Toggle Auto-Rotate |
| `R` | Reset View |

### Molecule Builder
| Shortcut | Action |
|----------|---------|
| `A` | Select Atom Tool |
| `B` | Select Bond Tool |
| `E` | Select Eraser Tool |
| `M` | Select Move Tool |
| `Delete` | Delete Selected |
| `Ctrl+D` | Duplicate Selection |
| `Ctrl+G` | Group Selection |

## Components

### AccessibilityProvider
Main context provider that manages accessibility state and keyboard shortcuts.

```tsx
import { AccessibilityProvider } from '@/lib/accessibility/context';

function App() {
  return (
    <AccessibilityProvider>
      {/* Your app content */}
    </AccessibilityProvider>
  );
}
```

### EnhancedNavigation
Accessible navigation component with keyboard shortcuts and ARIA labels.

```tsx
import { EnhancedNavigation } from '@/components/accessibility/enhanced-navigation';

function Layout() {
  return (
    <div>
      <EnhancedNavigation />
      <main>{/* Content */}</main>
    </div>
  );
}
```

### EnhancedCalculator
Fully accessible calculator with keyboard navigation and screen reader support.

```tsx
import { EnhancedCalculator } from '@/components/accessibility/enhanced-calculator';

function CalculatorPage() {
  return (
    <EnhancedCalculator
      title="Chemistry Calculator"
      description="Perform chemical calculations"
      scientific={true}
      onCalculate={(expression, result) => console.log(expression, result)}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Enhanced3DViewer
Accessible 3D molecular viewer with keyboard controls.

```tsx
import { Enhanced3DViewer } from '@/components/accessibility/enhanced-3d-viewer';

function ViewerPage() {
  return (
    <Enhanced3DViewer
      title="3D Molecular Viewer"
      description="Interactive 3D visualization"
      molecule="water"
      onControlsChange={(controls) => console.log(controls)}
    />
  );
}
```

### AccessibilityMenu
Dropdown menu for accessibility settings (high contrast, font size, etc.).

```tsx
import { AccessibilityMenu } from '@/components/accessibility/accessibility-menu';

function Header() {
  return (
    <header>
      <AccessibilityMenu />
      {/* Other header content */}
    </header>
  );
}
```

### KeyboardShortcutsDialog
Modal dialog showing all available keyboard shortcuts.

```tsx
import { KeyboardShortcutsDialog } from '@/components/accessibility/keyboard-shortcuts-dialog';

function App() {
  return (
    <div>
      {/* App content */}
      <KeyboardShortcutsDialog />
    </div>
  );
}
```

### SkipLinks
Skip navigation links for keyboard users.

```tsx
import { SkipLinks } from '@/components/accessibility/skip-links';

function Layout() {
  return (
    <div>
      <SkipLinks />
      <header>{/* Header */}</header>
      <main id="main-content">{/* Main content */}</main>
      <footer>{/* Footer */}</footer>
    </div>
  );
}
```

## Hooks

### useAccessibility
Main hook for accessing accessibility features and settings.

```tsx
import { useAccessibility } from '@/lib/accessibility/context';

function MyComponent() {
  const {
    highContrast,
    setHighContrast,
    announceToScreenReader,
    registerShortcut,
    unregisterShortcut
  } = useAccessibility();

  // Use accessibility features
}
```

### useAccessibilityFeatures
Hook for adding accessibility features to components.

```tsx
import { useAccessibilityFeatures } from '@/lib/accessibility/use-accessibility-features';

function MyComponent() {
  const elementRef = useRef<HTMLDivElement>(null);
  const { addARIAAttributes, announceChange, handleKeyboardNavigation } = useAccessibilityFeatures(elementRef, {
    context: 'my-context',
    announceOnMount: true,
    announceMessage: 'Component loaded'
  });

  useEffect(() => {
    addARIAAttributes({
      role: 'button',
      label: 'My button',
      expanded: false
    });
  }, []);

  return <div ref={elementRef}>Content</div>;
}
```

### useFocusManager
Hook for managing focus within components.

```tsx
import { useFocusManager } from '@/lib/accessibility/focus-manager';

function MyModal() {
  const modalRef = useRef<HTMLDivElement>(null);
  const { activateFocus, deactivateFocus } = useFocusManager(modalRef, {
    trapFocus: true,
    returnFocus: true
  });

  useEffect(() => {
    activateFocus();
    return () => deactivateFocus();
  }, []);

  return <div ref={modalRef}>Modal content</div>;
}
```

## Accessibility Settings

### High Contrast Mode
Increases color contrast for better visibility. Can be toggled via:
- Accessibility menu
- Keyboard shortcut (if implemented)
- Programmatically: `setHighContrast(true)`

### Font Size Scaling
Three levels of text scaling:
- Small (0.875rem)
- Medium (1rem) - default
- Large (1.125rem)

### Reduced Motion
Minimizes animations and transitions for users with motion sensitivity.

### Screen Reader Mode
Optimizes the interface for screen reader users with enhanced announcements and navigation.

## WCAG 2.1 AA Compliance

### Perceivable
- ✅ Text alternatives for non-text content
- ✅ Captions for videos (when applicable)
- ✅ Color contrast ratio of at least 4.5:1
- ✅ Resizable text up to 200% without assistive technology
- ✅ Images of text are avoided

### Operable
- ✅ All functionality available via keyboard
- ✅ No keyboard traps
- ✅ Sufficient time limits (where applicable)
- ✅ No seizure-inducing content
- ✅ Clear navigation and wayfinding

### Understandable
- ✅ Readable and understandable text
- ✅ Predictable functionality
- ✅ Input assistance and error identification
- ✅ Consistent navigation and identification

### Robust
- ✅ Compatible with assistive technologies
- ✅ Valid HTML and semantic structure
- ✅ Progressive enhancement
- ✅ Graceful degradation

## Testing

### Automated Testing
- Use accessibility testing tools like axe-core, Lighthouse, or WAVE
- Run automated tests as part of CI/CD pipeline
- Test keyboard navigation automatically

### Manual Testing
- Test with keyboard only (no mouse)
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Test with high contrast mode
- Test with zoomed text (200%+)
- Test with reduced motion enabled

### User Testing
- Include users with disabilities in testing
- Test with various assistive technologies
- Gather feedback on accessibility features
- Iterate based on user feedback

## Browser Support

### Modern Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Assistive Technology Support
- Screen readers: NVDA, JAWS, VoiceOver, TalkBack
- Keyboard navigation: All browsers
- High contrast mode: Windows, macOS, Linux
- Reduced motion: All modern browsers

## Implementation Guidelines

### 1. Use Semantic HTML
```html
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

### 2. Provide Alternative Text
```html
<img src="molecule.png" alt="Water molecule showing two hydrogen atoms bonded to one oxygen atom" />
```

### 3. Ensure Keyboard Accessibility
```html
<button onclick="submitForm()" onkeydown="handleKeyPress(event)">
  Submit
</button>
```

### 4. Use ARIA Labels Appropriately
```html
<button aria-label="Close dialog" aria-pressed="false">
  ×
</button>
```

### 5. Provide Clear Focus Indicators
```css
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## Resources

### WCAG Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.1 Understanding Documents](https://www.w3.org/WAI/WCAG21/Understanding/)
- [WCAG 2.1 Techniques](https://www.w3.org/WAI/WCAG21/Techniques/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Documentation
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project](https://www.a11yproject.com/)

## Support

For accessibility-related issues or questions:
1. Check this documentation
2. Test with the provided tools
3. Contact the development team
4. File issues in the project repository

## Contributing

When contributing to VerChem:
1. Follow accessibility best practices
2. Test with keyboard navigation
3. Verify screen reader compatibility
4. Ensure WCAG 2.1 AA compliance
5. Document accessibility features

---

*This accessibility system is continuously improved based on user feedback and evolving standards.*