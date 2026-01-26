'use client';

import React, { useState, useMemo } from 'react';
import { usePreferences } from '@/lib/preferences/context';
import { PREFERENCE_CATEGORIES, LANGUAGES, REGIONS, THEMES } from '@/lib/preferences/defaults';
import { PreferenceCategory } from '@/lib/preferences/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Accessibility,
  Calculator,
  Box,
  Atom,
  Download,
  Keyboard,
  Layout,
  Shield,
  Search,
  RotateCcw,
  Upload,
  DownloadCloud,
  X
} from 'lucide-react';

const ICONS = {
  general: Settings,
  accessibility: Accessibility,
  calculator: Calculator,
  viewer3d: Box,
  moleculeBuilder: Atom,
  export: Download,
  keyboard: Keyboard,
  ui: Layout,
  privacy: Shield,
} as const;

interface PreferencesPanelProps {
  open: boolean;
  onClose: () => void;
  defaultCategory?: PreferenceCategory;
}

export function PreferencesPanel({ open, onClose, defaultCategory = 'general' }: PreferencesPanelProps) {
  const { 
    preferences, 
    updateCategory, 
    resetPreferences, 
    resetCategory, 
    exportPreferences, 
    importPreferences,
    hasChanges 
  } = usePreferences();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<PreferenceCategory>(defaultCategory);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return Object.keys(PREFERENCE_CATEGORIES) as PreferenceCategory[];
    
    return (Object.keys(PREFERENCE_CATEGORIES) as PreferenceCategory[]).filter(category => {
      const categoryData = PREFERENCE_CATEGORIES[category];
      const categoryPrefs = preferences[category];
      
      // Search in category name and description
      if (categoryData.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoryData.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      
      // Search in preference values
      return Object.keys(categoryPrefs).some(key => {
        const value = categoryPrefs[key as keyof typeof categoryPrefs];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [searchTerm, preferences]);

  if (!open) return null;

  const handleExport = () => {
    void (async () => {
      const data = await exportPreferences();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verchem-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })();
  };

  const handleImport = () => {
    void (async () => {
      if (!importData.trim()) return;

      const success = await importPreferences(importData);
      if (success) {
        setShowImportDialog(false);
        setImportData('');
        return;
      }

      alert('Failed to import preferences. Please check the file format.');
    })();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Appearance</h3>
        
        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={preferences.general.theme}
            onValueChange={(value) => updateCategory('general', { theme: value as 'light' | 'dark' | 'system' })}
          >
            <SelectTrigger id="theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(THEMES).map(([key, theme]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{theme.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Language & Region</h3>
        
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={preferences.general.language}
            onValueChange={(value) => updateCategory('general', { language: value as 'en' | 'th' | 'zh' | 'es' | 'de' | 'fr' | 'ja' })}
          >
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGES).map(([key, lang]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    <span className="text-muted-foreground">({lang.native})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select
            value={preferences.general.region}
            onValueChange={(value) => updateCategory('general', { region: value as 'US' | 'TH' | 'CN' | 'ES' | 'DE' | 'FR' | 'JP' | 'auto' })}
          >
            <SelectTrigger id="region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REGIONS).map(([key, region]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{region.flag}</span>
                    <span>{region.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-detect">Auto-detect language</Label>
          <Switch
            id="auto-detect"
            checked={preferences.general.autoDetectLanguage}
            onCheckedChange={(checked) => updateCategory('general', { autoDetectLanguage: checked })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Date & Time</h3>
        
        <div className="space-y-2">
          <Label htmlFor="date-format">Date Format</Label>
          <Select
            value={preferences.general.dateFormat}
            onValueChange={(value) => updateCategory('general', { dateFormat: value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' })}
          >
            <SelectTrigger id="date-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-format">Time Format</Label>
          <Select
            value={preferences.general.timeFormat}
            onValueChange={(value) => updateCategory('general', { timeFormat: value as '12h' | '24h' })}
          >
            <SelectTrigger id="time-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour</SelectItem>
              <SelectItem value="24h">24-hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Visual</h3>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast">High contrast mode</Label>
          <Switch
            id="high-contrast"
            checked={preferences.accessibility.highContrast}
            onCheckedChange={(checked) => updateCategory('accessibility', { highContrast: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-size">Font size</Label>
          <Select
            value={preferences.accessibility.fontSize}
            onValueChange={(value) => updateCategory('accessibility', { fontSize: value as 'small' | 'medium' | 'large' | 'extra-large' })}
          >
            <SelectTrigger id="font-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="extra-large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="reduced-motion">Reduce motion</Label>
          <Switch
            id="reduced-motion"
            checked={preferences.accessibility.reducedMotion}
            onCheckedChange={(checked) => updateCategory('accessibility', { reducedMotion: checked })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Interaction</h3>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="screen-reader">Screen reader announcements</Label>
          <Switch
            id="screen-reader"
            checked={preferences.accessibility.screenReaderAnnouncements}
            onCheckedChange={(checked) => updateCategory('accessibility', { screenReaderAnnouncements: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="keyboard-nav">Keyboard navigation</Label>
          <Switch
            id="keyboard-nav"
            checked={preferences.accessibility.keyboardNavigation}
            onCheckedChange={(checked) => updateCategory('accessibility', { keyboardNavigation: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="focus-indicators">Focus indicators</Label>
          <Switch
            id="focus-indicators"
            checked={preferences.accessibility.focusIndicators}
            onCheckedChange={(checked) => updateCategory('accessibility', { focusIndicators: checked })}
          />
        </div>
      </div>
    </div>
  );

  const renderCalculatorSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Calculation</h3>
        
        <div className="space-y-2">
          <Label htmlFor="decimal-places">Decimal places: {preferences.calculator.decimalPlaces}</Label>
          <Slider
            id="decimal-places"
            min={0}
            max={10}
            step={1}
            value={[preferences.calculator.decimalPlaces]}
            onValueChange={(value) => updateCategory('calculator', { decimalPlaces: value[0] })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="scientific-notation">Scientific notation</Label>
          <Switch
            id="scientific-notation"
            checked={preferences.calculator.scientificNotation}
            onCheckedChange={(checked) => updateCategory('calculator', { scientificNotation: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="significant-figures">Use significant figures</Label>
          <Switch
            id="significant-figures"
            checked={preferences.calculator.significantFigures}
            onCheckedChange={(checked) => updateCategory('calculator', { significantFigures: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit-system">Unit system</Label>
          <Select
            value={preferences.calculator.unitSystem}
            onValueChange={(value) => updateCategory('calculator', { unitSystem: value as 'metric' | 'imperial' | 'si' })}
          >
            <SelectTrigger id="unit-system">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric</SelectItem>
              <SelectItem value="imperial">Imperial</SelectItem>
              <SelectItem value="si">SI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Display</h3>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-calculate">Auto-calculate</Label>
          <Switch
            id="auto-calculate"
            checked={preferences.calculator.autoCalculate}
            onCheckedChange={(checked) => updateCategory('calculator', { autoCalculate: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-steps">Show calculation steps</Label>
          <Switch
            id="show-steps"
            checked={preferences.calculator.showSteps}
            onCheckedChange={(checked) => updateCategory('calculator', { showSteps: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-format">Result format</Label>
          <Select
            value={preferences.calculator.resultFormat}
            onValueChange={(value) => updateCategory('calculator', { resultFormat: value as 'scientific' | 'standard' | 'engineering' })}
          >
            <SelectTrigger id="result-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="scientific">Scientific</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const categoryComponents: Record<PreferenceCategory, React.ReactNode> = {
    general: renderGeneralSettings(),
    accessibility: renderAccessibilitySettings(),
    calculator: renderCalculatorSettings(),
    viewer3d: <div>3D Viewer settings coming soon...</div>,
    moleculeBuilder: <div>Molecule Builder settings coming soon...</div>,
    export: <div>Export settings coming soon...</div>,
    keyboard: <div>Keyboard shortcuts coming soon...</div>,
    ui: <div>Interface settings coming soon...</div>,
    privacy: <div>Privacy settings coming soon...</div>,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[80vh] w-[90vw] max-w-6xl overflow-hidden rounded-lg bg-background shadow-lg">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Preferences</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-8rem)]">
            <div className="space-y-1">
              {filteredCategories.map((category) => {
                const Icon = ICONS[category];
                const categoryData = PREFERENCE_CATEGORIES[category];
                
                return (
                  <Button
                    key={category}
                    variant={activeCategory === category ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {categoryData.label}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {PREFERENCE_CATEGORIES[activeCategory].label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {PREFERENCE_CATEGORIES[activeCategory].description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <span className="text-sm text-muted-foreground">Unsaved changes</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetCategory(activeCategory)}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              {categoryComponents[activeCategory]}
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <DownloadCloud className="mr-1 h-3 w-3" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    Import
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={resetPreferences}>
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <Card className="w-[500px] p-6">
            <h3 className="mb-4 text-lg font-semibold">Import Preferences</h3>
            
            <div className="mb-4">
              <Label htmlFor="import-file">Select file</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Or paste the JSON data below:
              </p>
            </div>

            <div className="mb-4">
              <Label htmlFor="import-data">Preferences JSON</Label>
              <textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground"
                placeholder="Paste your preferences JSON here..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importData.trim()}>
                Import
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
