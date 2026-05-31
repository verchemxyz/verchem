'use client';

import React, { useState, useMemo } from 'react';
import { usePreferences } from '@/lib/preferences/context';
import { PREFERENCE_CATEGORIES, LANGUAGES, REGIONS, THEMES } from '@/lib/preferences/defaults';
import {
  PreferenceCategory,
  Viewer3DSettings,
  MoleculeBuilderSettings,
  ExportSettings,
  UISettings,
} from '@/lib/preferences/types';
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
                    <span className="font-mono text-xs uppercase text-muted-foreground">{key}</span>
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
                    <span className="font-mono text-xs uppercase text-muted-foreground">{key}</span>
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

  const renderViewer3DSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rendering</h3>

        <div className="space-y-2">
          <Label htmlFor="display-style">Display style</Label>
          <Select
            value={preferences.viewer3d.displayStyle}
            onValueChange={(value) => updateCategory('viewer3d', { displayStyle: value as Viewer3DSettings['displayStyle'] })}
          >
            <SelectTrigger id="display-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ball-stick">Ball &amp; stick</SelectItem>
              <SelectItem value="space-fill">Space-filling</SelectItem>
              <SelectItem value="wireframe">Wireframe</SelectItem>
              <SelectItem value="cartoon">Cartoon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="atom-colors">Atom color scheme</Label>
          <Select
            value={preferences.viewer3d.atomColors}
            onValueChange={(value) => updateCategory('viewer3d', { atomColors: value as Viewer3DSettings['atomColors'] })}
          >
            <SelectTrigger id="atom-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpk">CPK (standard)</SelectItem>
              <SelectItem value="shapely">Shapely (residue)</SelectItem>
              <SelectItem value="chain">By chain</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="viewer-quality">Render quality</Label>
          <Select
            value={preferences.viewer3d.quality}
            onValueChange={(value) => updateCategory('viewer3d', { quality: value as Viewer3DSettings['quality'] })}
          >
            <SelectTrigger id="viewer-quality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="ultra">Ultra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="background-color">Background color</Label>
          <Input
            id="background-color"
            type="color"
            value={preferences.viewer3d.backgroundColor}
            onChange={(e) => updateCategory('viewer3d', { backgroundColor: e.target.value })}
            className="h-10 w-16 cursor-pointer p-1"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Motion &amp; effects</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-rotate">Auto-rotate</Label>
          <Switch
            id="auto-rotate"
            checked={preferences.viewer3d.autoRotate}
            onCheckedChange={(checked) => updateCategory('viewer3d', { autoRotate: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rotate-speed">Rotation speed: {preferences.viewer3d.autoRotateSpeed.toFixed(1)}×</Label>
          <Slider
            id="rotate-speed"
            min={0.5}
            max={5}
            step={0.5}
            value={[preferences.viewer3d.autoRotateSpeed]}
            onValueChange={(value) => updateCategory('viewer3d', { autoRotateSpeed: value[0] })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="anti-aliasing">Anti-aliasing</Label>
          <Switch
            id="anti-aliasing"
            checked={preferences.viewer3d.antiAliasing}
            onCheckedChange={(checked) => updateCategory('viewer3d', { antiAliasing: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="shadows">Shadows</Label>
          <Switch
            id="shadows"
            checked={preferences.viewer3d.shadows}
            onCheckedChange={(checked) => updateCategory('viewer3d', { shadows: checked })}
          />
        </div>
      </div>
    </div>
  );

  const renderMoleculeBuilderSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Canvas</h3>

        <div className="space-y-2">
          <Label htmlFor="grid-size">Grid size: {preferences.moleculeBuilder.gridSize}px</Label>
          <Slider
            id="grid-size"
            min={10}
            max={40}
            step={5}
            value={[preferences.moleculeBuilder.gridSize]}
            onValueChange={(value) => updateCategory('moleculeBuilder', { gridSize: value[0] })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-grid">Show grid</Label>
          <Switch
            id="show-grid"
            checked={preferences.moleculeBuilder.showGrid}
            onCheckedChange={(checked) => updateCategory('moleculeBuilder', { showGrid: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="snap-grid">Snap to grid</Label>
          <Switch
            id="snap-grid"
            checked={preferences.moleculeBuilder.snapToGrid}
            onCheckedChange={(checked) => updateCategory('moleculeBuilder', { snapToGrid: checked })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Defaults</h3>

        <div className="space-y-2">
          <Label htmlFor="default-atom">Default atom</Label>
          <Select
            value={preferences.moleculeBuilder.defaultAtom}
            onValueChange={(value) => updateCategory('moleculeBuilder', { defaultAtom: value })}
          >
            <SelectTrigger id="default-atom">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['C', 'H', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br'].map((atom) => (
                <SelectItem key={atom} value={atom}>{atom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bond-type">Default bond</Label>
          <Select
            value={preferences.moleculeBuilder.bondType}
            onValueChange={(value) => updateCategory('moleculeBuilder', { bondType: value as MoleculeBuilderSettings['bondType'] })}
          >
            <SelectTrigger id="bond-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="double">Double</SelectItem>
              <SelectItem value="triple">Triple</SelectItem>
              <SelectItem value="aromatic">Aromatic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Behavior</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="builder-autosave">Auto-save drafts</Label>
          <Switch
            id="builder-autosave"
            checked={preferences.moleculeBuilder.autoSave}
            onCheckedChange={(checked) => updateCategory('moleculeBuilder', { autoSave: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="builder-validation">Live valence validation</Label>
          <Switch
            id="builder-validation"
            checked={preferences.moleculeBuilder.validationEnabled}
            onCheckedChange={(checked) => updateCategory('moleculeBuilder', { validationEnabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="builder-tooltips">Tooltips</Label>
          <Switch
            id="builder-tooltips"
            checked={preferences.moleculeBuilder.tooltips}
            onCheckedChange={(checked) => updateCategory('moleculeBuilder', { tooltips: checked })}
          />
        </div>
      </div>
    </div>
  );

  const renderExportSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Format</h3>

        <div className="space-y-2">
          <Label htmlFor="export-format">Default format</Label>
          <Select
            value={preferences.export.defaultFormat}
            onValueChange={(value) => updateCategory('export', { defaultFormat: value as ExportSettings['defaultFormat'] })}
          >
            <SelectTrigger id="export-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG (image)</SelectItem>
              <SelectItem value="jpg">JPG (image)</SelectItem>
              <SelectItem value="svg">SVG (vector)</SelectItem>
              <SelectItem value="pdf">PDF (document)</SelectItem>
              <SelectItem value="mol">MOL (structure)</SelectItem>
              <SelectItem value="sdf">SDF (structure)</SelectItem>
              <SelectItem value="pdb">PDB (structure)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color-profile">Color profile</Label>
          <Select
            value={preferences.export.colorProfile}
            onValueChange={(value) => updateCategory('export', { colorProfile: value as ExportSettings['colorProfile'] })}
          >
            <SelectTrigger id="color-profile">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sRGB">sRGB</SelectItem>
              <SelectItem value="AdobeRGB">Adobe RGB</SelectItem>
              <SelectItem value="ProPhotoRGB">ProPhoto RGB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Raster quality</h3>

        <div className="space-y-2">
          <Label htmlFor="image-quality">Image quality: {Math.round(preferences.export.imageQuality * 100)}%</Label>
          <Slider
            id="image-quality"
            min={0.1}
            max={1}
            step={0.05}
            value={[preferences.export.imageQuality]}
            onValueChange={(value) => updateCategory('export', { imageQuality: value[0] })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution">Resolution (DPI)</Label>
          <Select
            value={String(preferences.export.resolution)}
            onValueChange={(value) => updateCategory('export', { resolution: Number(value) })}
          >
            <SelectTrigger id="resolution">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="72">72 (screen)</SelectItem>
              <SelectItem value="150">150 (draft print)</SelectItem>
              <SelectItem value="300">300 (print)</SelectItem>
              <SelectItem value="600">600 (high-res)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="transparent-bg">Transparent background</Label>
          <Switch
            id="transparent-bg"
            checked={preferences.export.transparentBackground}
            onCheckedChange={(checked) => updateCategory('export', { transparentBackground: checked })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Watermark</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="include-watermark">Include watermark</Label>
          <Switch
            id="include-watermark"
            checked={preferences.export.includeWatermark}
            onCheckedChange={(checked) => updateCategory('export', { includeWatermark: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="watermark-text">Watermark text</Label>
          <Input
            id="watermark-text"
            value={preferences.export.watermarkText}
            onChange={(e) => updateCategory('export', { watermarkText: e.target.value })}
            disabled={!preferences.export.includeWatermark}
            placeholder="VerChem"
          />
        </div>
      </div>
    </div>
  );

  const renderKeyboardSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Shortcuts</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="kbd-enabled">Enable keyboard shortcuts</Label>
          <Switch
            id="kbd-enabled"
            checked={preferences.keyboard.enabled}
            onCheckedChange={(checked) => updateCategory('keyboard', { enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="kbd-hints">Show shortcut hints</Label>
          <Switch
            id="kbd-hints"
            checked={preferences.keyboard.showHints}
            onCheckedChange={(checked) => updateCategory('keyboard', { showHints: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="kbd-vim">Vim mode</Label>
          <Switch
            id="kbd-vim"
            checked={preferences.keyboard.vimMode}
            onCheckedChange={(checked) => updateCategory('keyboard', { vimMode: checked })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Reference</h3>
        <p className="text-sm text-muted-foreground">Common shortcuts available across VerChem tools.</p>
        <dl className="space-y-2 text-sm">
          {[
            { keys: 'Ctrl / ⌘ + K', action: 'Open command palette' },
            { keys: 'Ctrl / ⌘ + S', action: 'Save current work' },
            { keys: '/', action: 'Focus search' },
            { keys: 'Esc', action: 'Close dialog or panel' },
          ].map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{s.action}</dt>
              <dd>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">{s.keys}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );

  const renderUISettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Layout</h3>

        <div className="space-y-2">
          <Label htmlFor="sidebar-position">Sidebar position</Label>
          <Select
            value={preferences.ui.sidebarPosition}
            onValueChange={(value) => updateCategory('ui', { sidebarPosition: value as UISettings['sidebarPosition'] })}
          >
            <SelectTrigger id="sidebar-position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tab-position">Tab position</Label>
          <Select
            value={preferences.ui.tabPosition}
            onValueChange={(value) => updateCategory('ui', { tabPosition: value as UISettings['tabPosition'] })}
          >
            <SelectTrigger id="tab-position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="side">Side</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="density">Density</Label>
          <Select
            value={preferences.ui.density}
            onValueChange={(value) => updateCategory('ui', { density: value as UISettings['density'] })}
          >
            <SelectTrigger id="density">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Behavior</h3>

        <div className="space-y-2">
          <Label htmlFor="animation-speed">Animation speed</Label>
          <Select
            value={preferences.ui.animationSpeed}
            onValueChange={(value) => updateCategory('ui', { animationSpeed: value as UISettings['animationSpeed'] })}
          >
            <SelectTrigger id="animation-speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">Slow</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="compact-mode">Compact mode</Label>
          <Switch
            id="compact-mode"
            checked={preferences.ui.compactMode}
            onCheckedChange={(checked) => updateCategory('ui', { compactMode: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ui-tooltips">Show tooltips</Label>
          <Switch
            id="ui-tooltips"
            checked={preferences.ui.showTooltips}
            onCheckedChange={(checked) => updateCategory('ui', { showTooltips: checked })}
          />
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Data</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="analytics">Usage analytics</Label>
          <Switch
            id="analytics"
            checked={preferences.privacy.analyticsEnabled}
            onCheckedChange={(checked) => updateCategory('privacy', { analyticsEnabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="data-sharing">Anonymous data sharing</Label>
          <Switch
            id="data-sharing"
            checked={preferences.privacy.dataSharing}
            onCheckedChange={(checked) => updateCategory('privacy', { dataSharing: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="local-only">Store data on this device only</Label>
          <Switch
            id="local-only"
            checked={preferences.privacy.localStorageOnly}
            onCheckedChange={(checked) => updateCategory('privacy', { localStorageOnly: checked, ...(checked ? { cloudSync: false } : {}) })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sync &amp; security</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="cloud-sync">Cloud sync (AIVerID)</Label>
          <Switch
            id="cloud-sync"
            checked={preferences.privacy.cloudSync}
            disabled={preferences.privacy.localStorageOnly}
            onCheckedChange={(checked) => updateCategory('privacy', { cloudSync: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="encryption">Encrypt stored preferences</Label>
          <Switch
            id="encryption"
            checked={preferences.privacy.encryptionEnabled}
            onCheckedChange={(checked) => updateCategory('privacy', { encryptionEnabled: checked })}
          />
        </div>
      </div>
    </div>
  );

  const categoryComponents: Record<PreferenceCategory, React.ReactNode> = {
    general: renderGeneralSettings(),
    accessibility: renderAccessibilitySettings(),
    calculator: renderCalculatorSettings(),
    viewer3d: renderViewer3DSettings(),
    moleculeBuilder: renderMoleculeBuilderSettings(),
    export: renderExportSettings(),
    keyboard: renderKeyboardSettings(),
    ui: renderUISettings(),
    privacy: renderPrivacySettings(),
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
