'use client';

import React, { useState } from 'react';
import { usePreferences } from '@/lib/preferences/context';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  Moon,
  Sun,
  Computer,
  Palette,
  Type,
  Circle,
  Zap
} from 'lucide-react';
import { THEMES, LANGUAGES } from '@/lib/preferences/defaults';

interface QuickSettingsProps {
  trigger?: React.ReactNode;
}

export function QuickSettings({ trigger }: QuickSettingsProps) {
  const { preferences, updateCategory } = usePreferences();
  const [open, setOpen] = useState(false);

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Computer,
  };

  const handleThemeChange = (theme: string) => {
    updateCategory('general', { theme: theme as 'light' | 'dark' | 'system' });
  };

  const handleLanguageChange = (language: string) => {
    updateCategory('general', { language: language as 'en' | 'th' | 'zh' | 'es' | 'de' | 'fr' | 'ja' });
  };

  const handleFontSizeChange = (fontSize: string) => {
    updateCategory('accessibility', { fontSize: fontSize as 'small' | 'medium' | 'large' | 'extra-large' });
  };

  const toggleHighContrast = () => {
    updateCategory('accessibility', { highContrast: !preferences.accessibility.highContrast });
  };

  const toggleReducedMotion = () => {
    updateCategory('accessibility', { reducedMotion: !preferences.accessibility.reducedMotion });
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <Settings className="h-4 w-4" />
    </Button>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Theme Section */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup 
          value={preferences.general.theme} 
          onValueChange={handleThemeChange}
        >
          {Object.entries(THEMES).map(([key, theme]) => {
            const Icon = themeIcons[key as keyof typeof themeIcons];
            return (
              <DropdownMenuRadioItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{theme.name}</span>
                </div>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Language Section */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Language
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup 
          value={preferences.general.language} 
          onValueChange={handleLanguageChange}
        >
          {Object.entries(LANGUAGES).slice(0, 4).map(([key, lang]) => (
            <DropdownMenuRadioItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
          {Object.keys(LANGUAGES).length > 4 && (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              +{Object.keys(LANGUAGES).length - 4} more languages
            </DropdownMenuItem>
          )}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Accessibility Section */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Accessibility
        </DropdownMenuLabel>
        
        <DropdownMenuCheckboxItem
          checked={preferences.accessibility.highContrast}
          onCheckedChange={toggleHighContrast}
        >
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4" />
            <span>High contrast</span>
          </div>
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={preferences.accessibility.reducedMotion}
          onCheckedChange={toggleReducedMotion}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Reduce motion</span>
          </div>
        </DropdownMenuCheckboxItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span>Font size</span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={preferences.accessibility.fontSize} 
              onValueChange={handleFontSizeChange}
            >
              <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="extra-large">Extra Large</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Quick Actions */}
        <DropdownMenuItem onClick={() => setOpen(false)}>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Open full settings</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
