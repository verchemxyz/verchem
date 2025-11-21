'use client';

import React, { useState, useRef } from 'react';
import { ExportManager, ExportFormat, ExportQuality } from '@/lib/export/export-manager';

interface ExportButtonProps {
  elementRef?: React.RefObject<HTMLElement>;
  elementSelector?: string;
  filename?: string;
  formats?: ExportFormat[];
  defaultFormat?: ExportFormat;
  defaultQuality?: ExportQuality;
  showQuality?: boolean;
  showTimestamp?: boolean;
  showWatermark?: boolean;
  className?: string;
  variant?: 'button' | 'icon' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  icon?: React.ReactNode;
  onExportStart?: () => void;
  onExportComplete?: (success: boolean) => void;
  onExportError?: (error: Error) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  elementRef,
  elementSelector,
  filename = 'export',
  formats = ['png', 'pdf', 'svg'],
  defaultFormat = 'png',
  defaultQuality = 'high',
  showQuality = true,
  showTimestamp = true,
  showWatermark = false,
  className = '',
  variant = 'button',
  size = 'md',
  label = 'Export',
  icon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const [selectedQuality, setSelectedQuality] = useState<ExportQuality>(defaultQuality);
  const [includeTimestamp, setIncludeTimestamp] = useState(showTimestamp);
  const [addWatermark, setAddWatermark] = useState(showWatermark);
  const buttonRef = useRef<HTMLDivElement>(null);

  const getElement = (): HTMLElement | null => {
    if (elementRef?.current) {
      return elementRef.current;
    }
    
    if (elementSelector) {
      return document.querySelector(elementSelector) as HTMLElement;
    }
    
    return null;
  };

  const handleExport = async (format: ExportFormat) => {
    const element = getElement();
    
    if (!element) {
      const error = new Error('No element found to export');
      onExportError?.(error);
      return;
    }

    setIsExporting(true);
    onExportStart?.();

    try {
      await ExportManager.exportElement(element, {
        format,
        quality: selectedQuality,
        filename,
        includeTimestamp,
        addWatermark,
        watermarkText: 'VerChem'
      });

      onExportComplete?.(true);
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error as Error);
      onExportComplete?.(false);
    } finally {
      setIsExporting(false);
      setShowFormatMenu(false);
    }
  };

  const getButtonSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-4 py-2 text-lg';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const baseButtonClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-colors
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getButtonSizeClasses()}
    ${className}
  `;

  const primaryButtonClasses = `
    ${baseButtonClasses}
    bg-blue-600 text-white hover:bg-blue-700
    dark:bg-blue-500 dark:hover:bg-blue-600
  `;

  if (variant === 'icon') {
    return (
      <button
        onClick={() => handleExport(selectedFormat)}
        disabled={isExporting}
        className={`
          p-2 rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          text-gray-600 hover:text-gray-900 hover:bg-gray-100
          dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700
          ${className}
        `}
        title={`Export as ${selectedFormat.toUpperCase()}`}
      >
        {isExporting ? (
          <svg className={`animate-spin ${getIconSizeClasses()}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <span className={getIconSizeClasses()}>{icon}</span>
        )}
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative" ref={buttonRef}>
        <div className="flex rounded-lg overflow-hidden">
          <button
            onClick={() => handleExport(selectedFormat)}
            disabled={isExporting}
            className={primaryButtonClasses}
          >
            {isExporting ? (
              <svg className={`animate-spin ${getIconSizeClasses()}`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span className={getIconSizeClasses()}>{icon}</span>
            )}
            {label}
          </button>
          
          <button
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            disabled={isExporting}
            className={`
              ${primaryButtonClasses}
              border-l border-blue-700 dark:border-blue-400
              px-2
            `}
          >
            <svg className={getIconSizeClasses()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showFormatMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-1">
                Format
              </div>
              {formats.map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    setSelectedFormat(format);
                    setShowFormatMenu(false);
                    handleExport(format);
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded
                    transition-colors
                    ${
                      selectedFormat === format
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {format.toUpperCase()}
                </button>
              ))}

              {showQuality && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-1">
                      Quality
                    </div>
                    {Object.entries(ExportManager.getQualitySettings()).map(([quality, label]) => (
                      <button
                        key={quality}
                        onClick={() => {
                          setSelectedQuality(quality as ExportQuality);
                          setShowFormatMenu(false);
                        }}
                        className={`
                          w-full text-left px-3 py-2 text-sm rounded
                          transition-colors
                          ${
                            selectedQuality === quality
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <label className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={includeTimestamp}
                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Include timestamp
                </label>
                
                {showWatermark && (
                  <label className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={addWatermark}
                      onChange={(e) => setAddWatermark(e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Add watermark
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => handleExport(selectedFormat)}
      disabled={isExporting}
      className={primaryButtonClasses}
    >
      {isExporting ? (
        <svg className={`animate-spin ${getIconSizeClasses()}`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <span className={getIconSizeClasses()}>{icon}</span>
      )}
      {label}
    </button>
  );
};

export default ExportButton;
