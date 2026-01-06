# VerChem Preferences System

A comprehensive user preferences and local storage system for VerChem that provides persistent user settings across all application features.

## Features

### 🎯 Core Features
- **9 Preference Categories**: General, Accessibility, Calculator, 3D Viewer, Molecule Builder, Export, Keyboard, UI, and Privacy
- **7 Language Support**: English, Thai, Chinese, Spanish, German, French, Japanese
- **3 Theme Options**: Light, Dark, System
- **Encrypted Storage**: AES‑GCM (Web Crypto) encryption at rest for preferences (key stored locally; not suitable for secrets)
- **Cross-Tab Sync**: Automatic synchronization across browser tabs
- **Version Migration**: Automatic migration between preference versions
- **Import/Export**: Full backup and restore functionality

### 🔧 Technical Features
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **React Context**: Global state management with hooks
- **Auto-Save**: Automatic persistence with debouncing
- **Search**: Find settings quickly with intelligent search
- **Validation**: Comprehensive preference validation
- **Accessibility**: WCAG compliant with screen reader support

## Quick Start

### 1. Wrap your app with PreferencesProvider

```tsx
import { PreferencesProvider } from '@/lib/preferences';

function App() {
  return (
    <PreferencesProvider>
      <YourApp />
    </PreferencesProvider>
  );
}
```

### 2. Use preferences in your components

```tsx
import { usePreferences, useCategoryPreference } from '@/lib/preferences';

function MyComponent() {
  const { preferences, updateCategory } = usePreferences();
  const [decimalPlaces, setDecimalPlaces] = useCategoryPreference('calculator', 'decimalPlaces');

  return (
    <div>
      <p>Current decimal places: {decimalPlaces}</p>
      <button onClick={() => setDecimalPlaces(6)}>
        Set to 6 decimal places
      </button>
    </div>
  );
}
```

### 3. Add quick settings to your UI

```tsx
import { QuickSettings } from '@/lib/preferences';

function Header() {
  return (
    <header>
      <QuickSettings />
      {/* Your other header content */}
    </header>
  );
}
```

## Preference Categories

### General Settings
- **Theme**: light, dark, system
- **Language**: 7 supported languages with flags
- **Region**: Auto-detect or manual selection
- **Date/Time Format**: Multiple format options

### Accessibility
- **High Contrast**: Enhanced color contrast
- **Font Size**: 4 size options (small to extra-large)
- **Reduced Motion**: Minimize animations
- **Screen Reader**: Enhanced announcements
- **Keyboard Navigation**: Full keyboard support
- **Focus Indicators**: Visible focus outlines

### Calculator
- **Decimal Places**: 0-10 decimal precision
- **Scientific Notation**: Toggle scientific notation
- **Significant Figures**: Use significant figures
- **Unit System**: Metric, Imperial, SI
- **Auto-Calculate**: Automatic calculations
- **Show Steps**: Display calculation steps
- **Result Format**: Standard, Scientific, Engineering

### 3D Viewer
- **Auto-Rotate**: Automatic molecule rotation
- **Display Style**: Ball-stick, space-fill, wireframe, cartoon
- **Quality Levels**: Low, medium, high, ultra
- **Background Color**: Customizable background
- **Atom Colors**: CPK, shapely, chain, temperature
- **Anti-Aliasing**: Smooth rendering
- **Shadows**: Realistic lighting

### Molecule Builder
- **Grid Settings**: Size, snap-to-grid, visibility
- **Auto-Save**: Automatic project saving
- **Validation**: Real-time validation
- **Default Atom**: Starting atom type
- **Bond Types**: Single, double, triple, aromatic
- **Tooltips**: Helpful hints

### Export Settings
- **Formats**: PNG, JPG, SVG, PDF, MOL, SDF, PDB
- **Image Quality**: 0-100% quality setting
- **Resolution**: DPI settings
- **Transparent Background**: Alpha channel support
- **Watermark**: Custom watermark text
- **Color Profiles**: sRGB, AdobeRGB, ProPhotoRGB

### Keyboard Shortcuts
- **Enable/Disable**: Global toggle
- **Custom Bindings**: User-defined shortcuts
- **Show Hints**: Display shortcut hints
- **Vim Mode**: Vim-style navigation

### UI Settings
- **Sidebar Position**: Left, right, auto
- **Compact Mode**: Dense interface
- **Tooltips**: Help text display
- **Animation Speed**: Slow, normal, fast, none
- **Density**: Comfortable, compact, spacious
- **Tab Position**: Top, side

### Privacy
- **Analytics**: Usage analytics toggle
- **Data Sharing**: Share usage data
- **Cloud Sync**: Sync across devices
- **Local Storage Only**: No cloud storage
- **Encryption**: Encrypt sensitive data

## Components

### PreferencesPanel
Full-featured preferences dialog with category navigation and search.

```tsx
<PreferencesPanel 
  open={isOpen} 
  onClose={() => setIsOpen(false)}
  defaultCategory="general"
/>
```

### QuickSettings
Compact dropdown for common settings (theme, language, accessibility).

```tsx
<QuickSettings />
```

### PreferenceToggle
Reusable toggle component for boolean preferences.

```tsx
<PreferenceToggle
  category="accessibility"
  preference="highContrast"
  label="High Contrast Mode"
  description="Increase color contrast"
/>
```

### SettingsSearch
Intelligent search component for finding settings.

```tsx
<SettingsSearch 
  onResultClick={handleResultClick}
  placeholder="Search settings..."
/>
```

## Hooks

### usePreferences
Main hook for accessing and updating preferences.

```tsx
const { preferences, updatePreferences, updateCategory, resetPreferences } = usePreferences();
```

### usePreference
Hook for accessing/updating a specific top-level preference.

```tsx
const [theme, setTheme] = usePreference('general');
```

### useCategoryPreference
Hook for accessing/updating a specific category preference.

```tsx
const [decimalPlaces, setDecimalPlaces] = useCategoryPreference('calculator', 'decimalPlaces');
```

### usePreferenceSync
Hook to sync preferences with external systems.

```tsx
usePreferenceSync({
  onChange: (event) => console.log('Preference changed:', event),
  syncInterval: 1000,
});
```

## Storage

### Local Storage (Default)
- **Encrypted (AES‑GCM)**: Web Crypto encryption at rest (enabled by default; key stored locally)
- **Fallback**: Base64(encodeURIComponent) encoding when Web Crypto is unavailable; raw JSON when encryption is disabled
- **Cross-Tab Sync**: Automatic synchronization
- **Version Migration**: Automatic updates
- **Quota**: ~5MB typical limit

### Session Storage
- **Temporary**: Cleared when tab closes
- **No Encryption**: Plain text storage
- **Faster**: No encryption overhead

### Custom / Secure Storage
- The built-in storage is **not suitable for secrets** (client-side key storage + XSS risk).
- For highly sensitive data, you should:
  - Store only opaque identifiers client-side, and keep real secrets on a server, **or**
  - Store sensitive data server-side with proper encryption and access control.

## Import/Export

### Export Preferences
```tsx
const { exportPreferences } = usePreferences();
const jsonData = await exportPreferences();
// Download or send to server
```

### Import Preferences
```tsx
const { importPreferences } = usePreferences();
const success = await importPreferences(jsonData);
```

### Backup/Restore
```tsx
import { createPreferencesBackup } from '@/lib/preferences/utils';

const { data, filename } = createPreferencesBackup(preferences);
// Download backup file
```

## Validation & Migration

### Automatic Migration
Preferences are automatically migrated when versions change:

```tsx
import { migratePreferences } from '@/lib/preferences/migrations';

const migrated = migratePreferences(oldPreferences);
```

### Validation
Validate preference structure and values:

```tsx
import { validatePreferencesStructure } from '@/lib/preferences/utils';

const { isValid, errors } = validatePreferencesStructure(preferences);
```

## Integration Examples

### Theme Integration
```tsx
import { useVerChemIntegrations } from '@/lib/preferences/integrations';

function App() {
  useVerChemIntegrations(); // Automatically syncs with theme system
  return <YourApp />;
}
```

### Calculator Integration
```tsx
useEffect(() => {
  const config = {
    decimalPlaces: preferences.calculator.decimalPlaces,
    scientificNotation: preferences.calculator.scientificNotation,
  };
  
  // Apply to your calculator
  updateCalculatorConfig(config);
}, [preferences.calculator]);
```

### Custom Integration
```tsx
usePreferenceWatcher((event) => {
  if (event.category === 'viewer3d' && event.key === 'quality') {
    update3DViewerQuality(event.newValue);
  }
}, ['viewer3d'], ['quality']);
```

## Best Practices

### 1. Use TypeScript
Always use TypeScript for type safety:

```tsx
import type { UserPreferences, PreferenceCategory } from '@/lib/preferences';
```

### 2. Debounce Updates
For frequent updates, use debouncing:

```tsx
const debouncedUpdate = useMemo(
  () => debounce((updates) => updatePreferences(updates), 500),
  [updatePreferences]
);
```

### 3. Handle Loading States
Check loading state before accessing preferences:

```tsx
const { preferences, isLoading } = usePreferences();

if (isLoading) return <LoadingSpinner />;
```

### 4. Validate Imports
Always validate imported preferences:

```tsx
const { success, preferences: imported, error } = importPreferencesFromJSON(data);
if (!success) {
  console.error('Import failed:', error);
}
```

### 5. Provide Fallbacks
Always provide fallback values:

```tsx
const theme = preferences?.general?.theme || 'system';
```

## Troubleshooting

### Preferences Not Saving
- Check browser localStorage quota
- Verify encryption key is consistent
- Check for console errors

### Cross-Tab Sync Not Working
- Ensure same origin/domain
- Check browser storage event support
- Verify storage key consistency

### Import/Export Failures
- Validate JSON format
- Check for required categories
- Verify version compatibility

### Performance Issues
- Reduce sync frequency
- Use debouncing for frequent updates
- Consider session storage for temporary data

## API Reference

See the TypeScript definitions in `/lib/preferences/types.ts` for complete API documentation.

## Examples

See `/components/preferences/PreferencesDemo.tsx` for a comprehensive example implementation.
