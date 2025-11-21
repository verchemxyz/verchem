'use client';

import React from 'react';
import { useCategoryPreference } from '@/lib/preferences/context';
import type { PreferenceCategory } from '@/lib/preferences/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PreferenceToggleProps {
  category: PreferenceCategory;
  preference: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: boolean) => void;
}

export function PreferenceToggle({
  category,
  preference,
  label,
  description,
  disabled = false,
  className,
  onChange,
}: PreferenceToggleProps) {
  const [value, setValue] = useCategoryPreference<boolean>(category, preference);

  const handleChange = (newValue: boolean) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="space-y-0.5">
        <Label htmlFor={`${category}-${preference}`} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={`${category}-${preference}`}
        checked={value}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}

interface PreferenceToggleGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function PreferenceToggleGroup({
  title,
  description,
  children,
  className,
}: PreferenceToggleGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
