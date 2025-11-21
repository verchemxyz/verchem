'use client';

import React, { useState } from 'react';
import { 
  usePreferences, 
  usePreference, 
  useCategoryPreference,
  QuickSettings,
  SettingsSearch,
  PreferenceToggle,
  PreferenceToggleGroup 
} from '@/lib/preferences';
import { PreferencesPanel } from './PreferencesPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Accessibility,
  Calculator,
  Eye,
  Atom,
  Download,
  Globe,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

interface SettingsSearchResult {
  category: string;
  label: string;
  value: unknown;
}

export function PreferencesDemo() {
  const { 
    preferences, 
    exportPreferences, 
    importPreferences, 
    resetPreferences,
    hasChanges 
  } = usePreferences();
  
  const [showPanel, setShowPanel] = useState(false);
  const [searchResult, setSearchResult] = useState<SettingsSearchResult | null>(null);

  // Example of using individual preference hooks
  const [, setTheme] = usePreference('general');
  const [, setHighContrast] = useCategoryPreference('accessibility', 'highContrast');
  const [decimalPlaces, setDecimalPlaces] = useCategoryPreference('calculator', 'decimalPlaces');

  const handleSearchResult = (result: SettingsSearchResult) => {
    setSearchResult(result);
    console.log('Search result:', result);
  };

  const handleExport = () => {
    const data = exportPreferences();
    console.log('Exported preferences:', data);
    alert('Preferences exported to console!');
  };

  const handleImport = () => {
    const sampleData = JSON.stringify(preferences, null, 2);
    const success = importPreferences(sampleData);
    alert(success ? 'Preferences imported successfully!' : 'Import failed!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preferences System Demo</h2>
          <p className="text-muted-foreground">
            Comprehensive user preferences and local storage system for VerChem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickSettings />
          <Button onClick={() => setShowPanel(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Full Settings
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Search</CardTitle>
          <CardDescription>
            Search through all available settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsSearch 
            onResultClick={handleSearchResult}
            placeholder="Search settings (try: 'theme', 'language', 'contrast')..."
          />
          {searchResult && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Found setting:</p>
              <p className="text-sm text-muted-foreground">
                {searchResult.category} → {searchResult.label}: {String(searchResult.value)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Preferences Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* General Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">General</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Theme</span>
                <div className="flex items-center gap-1">
                  {preferences.general.theme === 'light' && (
                    <Sun className="h-3 w-3" />
                  )}
                  {preferences.general.theme === 'dark' && (
                    <Moon className="h-3 w-3" />
                  )}
                  {preferences.general.theme === 'system' && (
                    <Monitor className="h-3 w-3" />
                  )}
                  <Badge variant="secondary">{preferences.general.theme}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Language</span>
                <Badge variant="secondary">{preferences.general.language}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Region</span>
                <Badge variant="secondary">{preferences.general.region}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessibility</CardTitle>
            <Accessibility className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <PreferenceToggle
                category="accessibility"
                preference="highContrast"
                label="High Contrast"
                description="Enable high contrast mode"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">Font Size</span>
                <Badge variant="secondary">{preferences.accessibility.fontSize}</Badge>
              </div>
              <PreferenceToggle
                category="accessibility"
                preference="reducedMotion"
                label="Reduced Motion"
                description="Minimize animations"
              />
            </div>
          </CardContent>
        </Card>

        {/* Calculator */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calculator</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Decimal Places</span>
                <Badge variant="secondary">{preferences.calculator.decimalPlaces}</Badge>
              </div>
              <PreferenceToggle
                category="calculator"
                preference="scientificNotation"
                label="Scientific Notation"
                description="Use scientific notation"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">Unit System</span>
                <Badge variant="secondary">{preferences.calculator.unitSystem}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3D Viewer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">3D Viewer</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <PreferenceToggle
                category="viewer3d"
                preference="autoRotate"
                label="Auto Rotate"
                description="Automatically rotate molecules"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">Display Style</span>
                <Badge variant="secondary">{preferences.viewer3d.displayStyle}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Quality</span>
                <Badge variant="secondary">{preferences.viewer3d.quality}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Molecule Builder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Molecule Builder</CardTitle>
            <Atom className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <PreferenceToggle
                category="moleculeBuilder"
                preference="snapToGrid"
                label="Snap to Grid"
                description="Snap atoms to grid points"
              />
              <PreferenceToggle
                category="moleculeBuilder"
                preference="showGrid"
                label="Show Grid"
                description="Display grid lines"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">Grid Size</span>
                <Badge variant="secondary">{preferences.moleculeBuilder.gridSize}px</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Default Format</span>
                <Badge variant="secondary">{preferences.export.defaultFormat}</Badge>
              </div>
              <PreferenceToggle
                category="export"
                preference="transparentBackground"
                label="Transparent BG"
                description="Use transparent background"
              />
              <PreferenceToggle
                category="export"
                preference="includeWatermark"
                label="Watermark"
                description="Add VerChem watermark"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Examples</CardTitle>
          <CardDescription>
            Test different preference controls and see how they affect the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Switcher */}
          <div>
            <h4 className="mb-3 font-medium">Theme Switcher</h4>
            <div className="flex gap-2">
              <Button
                variant={preferences.general.theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme({ ...preferences.general, theme: 'light' })}
              >
                <Sun className="mr-1 h-3 w-3" />
                Light
              </Button>
              <Button
                variant={preferences.general.theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme({ ...preferences.general, theme: 'dark' })}
              >
                <Moon className="mr-1 h-3 w-3" />
                Dark
              </Button>
              <Button
                variant={preferences.general.theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme({ ...preferences.general, theme: 'system' })}
              >
                <Monitor className="mr-1 h-3 w-3" />
                System
              </Button>
            </div>
          </div>

          <Separator />

          {/* Font Size Control */}
          <div>
            <h4 className="mb-3 font-medium">Font Size Control</h4>
            <div className="flex items-center gap-4">
              <span className="text-sm">Size:</span>
              <div className="flex gap-1">
                {['small', 'medium', 'large', 'extra-large'].map((size) => (
                  <Button
                    key={size}
                    variant={preferences.accessibility.fontSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHighContrast(preferences.accessibility.highContrast)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Calculator Precision */}
          <div>
            <h4 className="mb-3 font-medium">Calculator Precision</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Decimal Places: {Number(decimalPlaces)}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDecimalPlaces(Math.max(0, Number(decimalPlaces) - 1))}
                    disabled={Number(decimalPlaces) <= 0}
                  >
                    -
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDecimalPlaces(Math.min(10, Number(decimalPlaces) + 1))}
                    disabled={Number(decimalPlaces) >= 10}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Current: π = {Math.PI.toFixed(Number(decimalPlaces))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Toggle Groups */}
          <div>
            <h4 className="mb-3 font-medium">Quick Toggles</h4>
            <PreferenceToggleGroup title="Accessibility" className="space-y-2">
              <PreferenceToggle
                category="accessibility"
                preference="highContrast"
                label="High Contrast Mode"
                description="Increase color contrast"
              />
              <PreferenceToggle
                category="accessibility"
                preference="reducedMotion"
                label="Reduce Motion"
                description="Minimize animations"
              />
              <PreferenceToggle
                category="accessibility"
                preference="keyboardNavigation"
                label="Keyboard Navigation"
                description="Enable keyboard shortcuts"
              />
            </PreferenceToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Export/Import Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Export/Import Demo</CardTitle>
          <CardDescription>
            Test backing up and restoring your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Preferences
            </Button>
            <Button onClick={handleImport} variant="outline">
              Import Sample
            </Button>
            <Button onClick={resetPreferences} variant="outline">
              Reset to Defaults
            </Button>
          </div>
          
          {hasChanges && (
            <div className="text-sm text-muted-foreground">
              ⚠️ You have unsaved changes that will be automatically saved
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences Panel */}
      <PreferencesPanel 
        open={showPanel} 
        onClose={() => setShowPanel(false)}
        defaultCategory="general"
      />
    </div>
  );
}
