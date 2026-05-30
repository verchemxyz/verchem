'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ExportManager, ExportFormat, ExportQuality } from '@/lib/export/export-manager';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  elementRef?: React.RefObject<HTMLElement>;
  elementSelector?: string;
  title?: string;
  defaultFilename?: string;
  availableFormats?: ExportFormat[];
  showPreview?: boolean;
  onExportStart?: () => void;
  onExportComplete?: (success: boolean) => void;
  onExportError?: (error: Error) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  elementRef,
  elementSelector,
  title = 'Export',
  defaultFilename = 'export',
  availableFormats = ['png', 'pdf', 'svg'],
  showPreview = true,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [selectedQuality, setSelectedQuality] = useState<ExportQuality>('high');
  const [filename, setFilename] = useState(defaultFilename);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [customWatermark, setCustomWatermark] = useState('VerChem');
  const [isExporting, setIsExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dpi, setDpi] = useState(300);
  const [scale, setScale] = useState(2);
  const dialogRef = useRef<HTMLDivElement>(null);

  const getElement = useCallback((): HTMLElement | null => {
    if (elementRef?.current) {
      return elementRef.current;
    }
    
    if (elementSelector) {
      return document.querySelector(elementSelector) as HTMLElement;
    }
    
    return null;
  }, [elementRef, elementSelector]);

  useEffect(() => {
    if (!isOpen || !showPreview) return;

    const generatePreview = async () => {
      const element = getElement();
      if (!element) return;

      try {
        const { CanvasExporter } = await import('@/lib/export/canvas-export');
        const canvas = await CanvasExporter.elementToCanvas(element, {
          scale: 1,
          backgroundColor: '#ffffff'
        });
        
        const dataURL = await CanvasExporter.canvasToDataURL(canvas, 'png', 0.8);
        setPreviewImage(dataURL);
      } catch (error) {
        console.error('Preview generation failed:', error);
        setPreviewImage(null);
      }
    };

    void generatePreview();
  }, [isOpen, showPreview, selectedFormat, selectedQuality, getElement]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleExport = async () => {
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
        format: selectedFormat,
        quality: selectedQuality,
        filename,
        includeTimestamp,
        addWatermark,
        watermarkText: customWatermark,
        dpi,
        scale
      });

      onExportComplete?.(true);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error as Error);
      onExportComplete?.(false);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/50"
          onClick={onClose}
        />

        {/* Dialog panel */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Export options"
          className="inline-block align-bottom bg-popover border border-border rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
        >
          {/* Header */}
          <div className="bg-muted px-4 py-3 sm:px-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">
                {title}
              </h3>
              <button
                onClick={onClose}
                aria-label="Close export dialog"
                className="text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-popover px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left panel - Settings */}
              <div className="space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableFormats.map((format) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`
                          px-3 py-2 text-sm font-medium rounded-md border
                          transition-colors
                          ${
                            selectedFormat === format
                              ? 'bg-primary-100 border-primary-300 text-primary-800'
                              : 'bg-card border-border text-foreground hover:bg-muted'
                          }
                        `}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Settings */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quality
                  </label>
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value as ExportQuality)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:ring-ring focus:border-ring"
                  >
                    {Object.entries(ExportManager.getQualitySettings()).map(([quality, label]) => (
                      <option key={quality} value={quality}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filename */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Filename
                  </label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:ring-ring focus:border-ring"
                    placeholder="Enter filename..."
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                      className="rounded border-border text-primary-600 focus:ring-ring"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Include timestamp in filename
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addWatermark}
                      onChange={(e) => setAddWatermark(e.target.checked)}
                      className="rounded border-border text-primary-600 focus:ring-ring"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      Add watermark
                    </span>
                  </label>

                  {addWatermark && (
                    <div className="ml-6">
                      <input
                        type="text"
                        value={customWatermark}
                        onChange={(e) => setCustomWatermark(e.target.value)}
                        className="w-full px-3 py-1 text-sm border border-border rounded bg-card text-foreground focus:ring-ring focus:border-ring"
                        placeholder="Watermark text..."
                      />
                    </div>
                  )}
                </div>

                {/* Advanced Settings */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <svg
                      className={`w-4 h-4 mr-1 transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Advanced Settings
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 p-3 bg-muted rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          DPI (for print)
                        </label>
                        <input
                          type="number"
                          value={dpi}
                          onChange={(e) => setDpi(Number(e.target.value))}
                          className="w-full px-3 py-1 text-sm border border-border rounded bg-card text-foreground focus:ring-ring focus:border-ring"
                          min="72"
                          max="1200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Scale Factor
                        </label>
                        <input
                          type="number"
                          value={scale}
                          onChange={(e) => setScale(Number(e.target.value))}
                          className="w-full px-3 py-1 text-sm border border-border rounded bg-card text-foreground focus:ring-ring focus:border-ring"
                          min="1"
                          max="10"
                          step="0.1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel - Preview */}
              {showPreview && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preview
                  </label>
                  <div className="border border-border rounded-lg p-4 bg-muted">
                    {previewImage ? (
                      // Preview uses a data URL; using a plain img here is acceptable
                      // for this internal tool dialog.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full h-auto rounded border border-border"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Preview will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-500 text-base font-medium text-primary-foreground hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                'Export'
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isExporting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-card text-base font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
